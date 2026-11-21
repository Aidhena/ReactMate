package com.kasmate.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.drawable.Icon;
import android.os.Build;

import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

public class KasMateMessagingService extends FirebaseMessagingService {
    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Map<String, String> data = remoteMessage.getData();
        RemoteMessage.Notification notification = remoteMessage.getNotification();
        String title = valueOrDefault(data.get("title"), notification == null ? null : notification.getTitle());
        String body = valueOrDefault(data.get("body"), notification == null ? null : notification.getBody());
        if (body == null || body.trim().isEmpty()) {
            return;
        }

        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (launchIntent == null) {
            return;
        }
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        String notificationId = data.get("notificationId");
        if (notificationId != null) {
            launchIntent.putExtra("notificationId", notificationId);
        }

        PendingIntent contentIntent = PendingIntent.getActivity(
            this,
            notificationId == null ? (int) System.currentTimeMillis() : notificationId.hashCode(),
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Bitmap iconBitmap = BitmapFactory.decodeResource(getResources(), R.drawable.notification_kasmate_logo);
        if (iconBitmap == null) {
            return;
        }

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(this, getString(R.string.push_notification_channel_id))
            : new Notification.Builder(this);
        builder
            .setSmallIcon(Icon.createWithBitmap(iconBitmap))
            .setColor(ContextCompat.getColor(this, R.color.notification_icon_color))
            .setContentTitle(title == null || title.trim().isEmpty() ? getString(R.string.app_name) : title)
            .setContentText(body)
            .setStyle(new Notification.BigTextStyle().bigText(body))
            .setPriority(Notification.PRIORITY_HIGH)
            .setCategory(Notification.CATEGORY_MESSAGE)
            .setAutoCancel(true)
            .setContentIntent(contentIntent);

        int notificationNumber = notificationId == null
            ? (int) System.currentTimeMillis()
            : notificationId.hashCode();
        try {
            NotificationManagerCompat.from(this).notify(notificationNumber, builder.build());
        } catch (SecurityException ignored) {
            // Android 13+ requires notification permission before the system will display alerts.
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }
        NotificationChannel channel = new NotificationChannel(
            getString(R.string.push_notification_channel_id),
            getString(R.string.push_notification_channel_name),
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Notifications from the KasMate desktop app");
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.createNotificationChannel(channel);
        }
    }

    private String valueOrDefault(String preferred, String fallback) {
        return preferred == null || preferred.trim().isEmpty() ? fallback : preferred;
    }
}
