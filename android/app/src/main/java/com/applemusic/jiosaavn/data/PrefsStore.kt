package com.applemusic.jiosaavn.data

import android.content.Context

class PrefsStore(context: Context) {
    private val prefs = context.getSharedPreferences("apple_music_auto", Context.MODE_PRIVATE)

    var apiBaseUrl: String
        get() = prefs.getString("api_base_url", "http://10.0.2.2:3000") ?: "http://10.0.2.2:3000"
        set(value) = prefs.edit().putString("api_base_url", value.trimEnd('/')).apply()

    var webAppUrl: String
        get() = prefs.getString("web_app_url", "http://10.0.2.2:5173") ?: "http://10.0.2.2:5173"
        set(value) = prefs.edit().putString("web_app_url", value.trimEnd('/')).apply()

    var authToken: String?
        get() = prefs.getString("auth_token", null)
        set(value) = prefs.edit().putString("auth_token", value).apply()

    var username: String?
        get() = prefs.getString("username", null)
        set(value) = prefs.edit().putString("username", value).apply()
}
