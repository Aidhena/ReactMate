package com.kasmate.app;

import android.Manifest;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.google.firebase.installations.FirebaseInstallations;
import com.google.firebase.messaging.FirebaseMessaging;

@CapacitorPlugin(
    name = "KasMatePush",
    permissions = {
        @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS })
    }
)
public class KasMatePushPlugin extends Plugin {
    @PluginMethod
    public void checkNotificationPermission(PluginCall call) {
        resolvePermission(call);
    }

    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU
            || getPermissionState("notifications") == PermissionState.GRANTED) {
            resolvePermission(call);
            return;
        }
        requestPermissionForAlias("notifications", call, "notificationPermissionCallback");
    }

    @PermissionCallback
    private void notificationPermissionCallback(PluginCall call) {
        resolvePermission(call);
    }

    @PluginMethod
    public void getInstallationId(PluginCall call) {
        FirebaseMessaging.getInstance().register().addOnCompleteListener(getActivity(), task -> {
            if (!task.isSuccessful()) {
                Exception exception = task.getException();
                call.reject("Firebase could not register this app installation.", exception);
                return;
            }

            FirebaseInstallations.getInstance().getId()
                .addOnSuccessListener(installationId -> {
                    JSObject result = new JSObject();
                    result.put("installationId", installationId);
                    call.resolve(result);
                })
                .addOnFailureListener(error ->
                    call.reject("Firebase could not read this app installation ID.", error)
                );
        });
    }

    private void resolvePermission(PluginCall call) {
        JSObject result = new JSObject();
        boolean granted = Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU
            || getPermissionState("notifications") == PermissionState.GRANTED;
        result.put("granted", granted);
        result.put("status", granted ? "granted" : getPermissionState("notifications").toString().toLowerCase());
        call.resolve(result);
    }
}
