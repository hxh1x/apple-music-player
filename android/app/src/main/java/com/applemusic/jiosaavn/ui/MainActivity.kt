package com.applemusic.jiosaavn.ui

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.applemusic.jiosaavn.data.ApiClient
import com.applemusic.jiosaavn.data.PrefsStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {
    private val uiScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private lateinit var prefs: PrefsStore
    private lateinit var apiClient: ApiClient
    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        prefs = PrefsStore(this)
        apiClient = ApiClient(prefs)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(0xFF000000.toInt())
        }

        // Top companion bar for Server URL & Android Auto Account Sync
        val topBar = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(24, 24, 24, 16)
            setBackgroundColor(0xFF161618.toInt())
        }

        val statusText = TextView(this).apply {
            text = prefs.username?.let { "Android Auto: $it" } ?: "Android Auto: Sign In"
            setTextColor(0xFFFFFFFF.toInt())
            textSize = 14f
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }

        val configBtn = Button(this).apply {
            text = "Car Setup"
            setOnClickListener { showSetupDialog(statusText) }
        }

        topBar.addView(statusText)
        topBar.addView(configBtn)

        webView = WebView(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                0,
                1f
            )
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            webViewClient = WebViewClient()
            webChromeClient = WebChromeClient()
            loadUrl(prefs.webAppUrl)
        }

        root.addView(topBar)
        root.addView(webView)
        setContentView(root)
    }

    private fun showSetupDialog(statusText: TextView) {
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 24, 48, 12)
        }

        val apiInput = EditText(this).apply {
            hint = "API Server URL (e.g. http://192.168.1.50:3000)"
            setText(prefs.apiBaseUrl)
        }
        val webInput = EditText(this).apply {
            hint = "Web App URL (e.g. http://192.168.1.50:5173)"
            setText(prefs.webAppUrl)
        }
        val userInput = EditText(this).apply {
            hint = "Account Email or Username (for Android Auto)"
        }
        val passInput = EditText(this).apply {
            hint = "Account Password"
            inputType = android.text.InputType.TYPE_CLASS_TEXT or
                android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD
        }

        layout.addView(apiInput)
        layout.addView(webInput)
        layout.addView(userInput)
        layout.addView(passInput)

        AlertDialog.Builder(this)
            .setTitle("Android Auto & Server Setup")
            .setView(layout)
            .setPositiveButton("Save & Sign In") { _, _ ->
                prefs.apiBaseUrl = apiInput.text.toString().trim()
                prefs.webAppUrl = webInput.text.toString().trim()
                webView.loadUrl(prefs.webAppUrl)

                val id = userInput.text.toString().trim()
                val pw = passInput.text.toString()
                if (id.isNotEmpty() && pw.isNotEmpty()) {
                    uiScope.launch {
                        val res = apiClient.login(id, pw)
                        res.onSuccess { user ->
                            statusText.text = "Android Auto: $user"
                            Toast.makeText(this@MainActivity, "Synced for Android Auto!", Toast.LENGTH_SHORT).show()
                        }.onFailure { err ->
                            Toast.makeText(this@MainActivity, err.message ?: "Login failed", Toast.LENGTH_LONG).show()
                        }
                    }
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }

    override fun onDestroy() {
        uiScope.cancel()
        super.onDestroy()
    }
}
