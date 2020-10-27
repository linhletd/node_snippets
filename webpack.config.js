const dotenv = require('dotenv').config();
let path = require('path');
module.exports = {
    entry: {
        main: './websocket/client.js',
        worker: './websocket/front/workers/detect_wakeup.js',
    },
    output: {
        path: path.resolve(__dirname, 'statics', 'js'),
        filename: '[name].bundle.js'
    },
    mode: process.env.NODE_ENV,
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use:{
                    loader: 'babel-loader',
                    options:{
                        presets: ['@babel/preset-env', '@babel/preset-react'],
                        plugins: [
                            ['@babel/plugin-transform-runtime'],
                            [
                                "@babel/plugin-proposal-class-properties",
                                {
                                  "loose": true
                                }
                            ]
                        ]
                    }
                }
            },
            {
                test: /(\/workers\/).+\.js$/i,
                loader: 'worker-loader',
                options: {
                    worker:'DedicatedWorker',
                },
              }
        ]
    }
}