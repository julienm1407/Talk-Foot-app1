package com.talkfoot.app;

import android.content.Context;
import android.content.res.Configuration;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  protected void attachBaseContext(Context newBase) {
    Configuration override = new Configuration(newBase.getResources().getConfiguration());
    override.fontScale = 1f;
    super.attachBaseContext(newBase.createConfigurationContext(override));
  }

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    lockWebViewZoom();
  }

  @Override
  public void onResume() {
    super.onResume();
    lockWebViewZoom();
  }

  @Override
  public void onConfigurationChanged(Configuration newConfig) {
    if (newConfig.fontScale != 1f) {
      newConfig.fontScale = 1f;
    }
    super.onConfigurationChanged(newConfig);
    lockWebViewZoom();
  }

  private void lockWebViewZoom() {
    if (getBridge() == null) {
      return;
    }
    WebView webView = getBridge().getWebView();
    if (webView == null) {
      return;
    }
    WebSettings settings = webView.getSettings();
    settings.setTextZoom(100);
    settings.setSupportZoom(false);
    settings.setBuiltInZoomControls(false);
    settings.setDisplayZoomControls(false);
  }
}
