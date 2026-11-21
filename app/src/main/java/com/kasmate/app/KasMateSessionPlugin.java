package com.kasmate.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.Arrays;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

@CapacitorPlugin(name = "KasMateSession")
public class KasMateSessionPlugin extends Plugin {
    private static final String PREFERENCES_NAME = "kasmate_secure_session";
    private static final String SESSION_KEY = "encrypted_session";
    private static final String KEY_ALIAS = "com.kasmate.app.secure-session.v1";
    private static final String KEYSTORE_PROVIDER = "AndroidKeyStore";

    @PluginMethod
    public void saveSession(PluginCall call) {
        String value = call.getString("value");
        if (value == null || value.isEmpty()) {
            call.reject("A non-empty session value is required.");
            return;
        }

        try {
            String encrypted = encrypt(value);
            boolean saved = preferences().edit().putString(SESSION_KEY, encrypted).commit();
            if (!saved) {
                call.reject("The secure session could not be saved.");
                return;
            }
            call.resolve();
        } catch (Exception exception) {
            call.reject("The secure session could not be saved.", exception);
        }
    }

    @PluginMethod
    public void loadSession(PluginCall call) {
        String encrypted = preferences().getString(SESSION_KEY, null);
        String value = null;
        if (encrypted != null) {
            try {
                value = decrypt(encrypted);
            } catch (Exception exception) {
                // An invalidated or corrupted key must not trap the user in a failed restore loop.
                preferences().edit().remove(SESSION_KEY).commit();
            }
        }

        JSObject result = new JSObject();
        result.put("value", value);
        call.resolve(result);
    }

    @PluginMethod
    public void clearSession(PluginCall call) {
        boolean cleared = preferences().edit().remove(SESSION_KEY).commit();
        try {
            KeyStore keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER);
            keyStore.load(null);
            if (keyStore.containsAlias(KEY_ALIAS)) {
                keyStore.deleteEntry(KEY_ALIAS);
            }
        } catch (Exception ignored) {
            // The ciphertext is already removed; a later login can replace the key if needed.
        }

        if (!cleared) {
            call.reject("The secure session could not be cleared.");
            return;
        }
        call.resolve();
    }

    private SharedPreferences preferences() {
        return getContext().getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
    }

    private String encrypt(String value) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey());
        byte[] ciphertext = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
        String iv = Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP);
        String encrypted = Base64.encodeToString(ciphertext, Base64.NO_WRAP);
        return iv + "." + encrypted;
    }

    private String decrypt(String value) throws Exception {
        String[] parts = value.split("\\.", 2);
        if (parts.length != 2) {
            throw new IllegalArgumentException("Stored session data is invalid.");
        }
        byte[] iv = Base64.decode(parts[0], Base64.NO_WRAP);
        byte[] ciphertext = Base64.decode(parts[1], Base64.NO_WRAP);
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, getOrCreateKey(), new GCMParameterSpec(128, iv));
        byte[] plaintext = cipher.doFinal(ciphertext);
        try {
            return new String(plaintext, StandardCharsets.UTF_8);
        } finally {
            Arrays.fill(plaintext, (byte) 0);
        }
    }

    private SecretKey getOrCreateKey() throws Exception {
        KeyStore keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER);
        keyStore.load(null);
        if (keyStore.containsAlias(KEY_ALIAS)) {
            return (SecretKey) keyStore.getKey(KEY_ALIAS, null);
        }

        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE_PROVIDER);
        generator.init(new KeyGenParameterSpec.Builder(
            KEY_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT
        )
            .setKeySize(256)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setRandomizedEncryptionRequired(true)
            .build());
        return generator.generateKey();
    }
}
