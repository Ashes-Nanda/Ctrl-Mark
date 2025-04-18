const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        popup: './popup.js',
        content: './content.js',
        background: './background.js'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true
    },
    plugins: [
        new Dotenv({
            systemvars: true,
            safe: true
        }),
        new CopyPlugin({
            patterns: [
                { from: "manifest.json", to: "manifest.json" },
                { from: "popup.html", to: "popup.html" },
                { from: "icons", to: "icons" }
            ],
        }),
    ],
    resolve: {
        fallback: {
            "process": require.resolve("process/browser")
        }
    }
}; 