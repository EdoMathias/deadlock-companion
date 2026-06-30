const path = require('path'),
  webpack = require('webpack'),
  HtmlWebpackPlugin = require('html-webpack-plugin'),
  CopyPlugin = require('copy-webpack-plugin'),
  { CleanWebpackPlugin } = require('clean-webpack-plugin'),
  OverwolfPlugin = require('./overwolf.webpack');

module.exports = (env) => ({
  entry: {
    background: './src/main/background.ts',
    main_desktop: './src/renderer/main-window/Main.tsx',
    main_ingame: './src/renderer/main-window/Main.tsx',
    // rotation_ingame: './src/renderer/rotation-window/Rotation.tsx',
    companion_app_ready:
      './src/renderer/companion-ready-window/CompanionAppReady.tsx',
    alert_overlay:
      './src/renderer/alert-overlay-window/AlertOverlay.tsx',
    counter_items:
      './src/renderer/counter-items-window/CounterItems.tsx',
    ultimate_alert:
      './src/renderer/ultimate-alert-window/UltimateAlert.tsx',
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              url: {
                filter: (url, resourcePath) => {
                  // Don't process URLs for window control SVGs
                  // These are already copied by CopyPlugin to dist/img/
                  if (
                    url.includes('img/window_') ||
                    url.includes('../../public/img/') ||
                    url.startsWith('img/')
                  ) {
                    return false;
                  }
                  return true;
                },
              },
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      deadlock_api_client: path.resolve(
        __dirname,
        'src/shared/vendor/deadlock-api-client/index.ts',
      ),
    },
  },
  output: {
    path: path.resolve(__dirname, 'dist/'),
    filename: 'js/[name].js',
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: [{ from: 'public', to: './' }],
    }),
    new HtmlWebpackPlugin({
      template: './src/main/background.html',
      filename: path.resolve(__dirname, './dist/background.html'),
      chunks: ['background'],
    }),
    new HtmlWebpackPlugin({
      template: './src/renderer/main-window/main.html',
      filename: path.resolve(__dirname, './dist/main_desktop.html'),
      chunks: ['main_desktop'],
    }),
    new HtmlWebpackPlugin({
      template: './src/renderer/main-window/main.html',
      filename: path.resolve(__dirname, './dist/main_ingame.html'),
      chunks: ['main_ingame'],
    }),
    // new HtmlWebpackPlugin({
    //   template: './src/renderer/rotation-window/rotation_ingame.html',
    //   filename: path.resolve(__dirname, './dist/rotation_ingame.html'),
    //   chunks: ['rotation_ingame'],
    // }),
    new HtmlWebpackPlugin({
      template:
        './src/renderer/companion-ready-window/companion_app_ready.html',
      filename: path.resolve(__dirname, './dist/companion_app_ready.html'),
      chunks: ['companion_app_ready'],
    }),
    new HtmlWebpackPlugin({
      template:
        './src/renderer/alert-overlay-window/alert_overlay.html',
      filename: path.resolve(__dirname, './dist/alert_overlay.html'),
      chunks: ['alert_overlay'],
    }),
    new HtmlWebpackPlugin({
      template:
        './src/renderer/counter-items-window/counter_items.html',
      filename: path.resolve(__dirname, './dist/counter_items.html'),
      chunks: ['counter_items'],
    }),
    new HtmlWebpackPlugin({
      template:
        './src/renderer/ultimate-alert-window/ultimate_alert.html',
      filename: path.resolve(__dirname, './dist/ultimate_alert.html'),
      chunks: ['ultimate_alert'],
    }),
    new HtmlWebpackPlugin({
      template: './src/renderer/uninstall-window/uninstall.html',
      filename: path.resolve(__dirname, './dist/uninstall.html'),
      chunks: [],
    }),
    new webpack.DefinePlugin({
      // Base64-encoded Steam Web API key — decoded at runtime via atob()
      __STEAM_WEB_KEY__: JSON.stringify(
        'MjI3RkRCQzdCMzQxMjA1MjBGQkRCNzlGNTNGNEMzMTc=',
      ),
    }),
    new OverwolfPlugin(env),
  ],
});
