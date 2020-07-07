const dotenv = require('dotenv').config();
module.exports = {
    entry: './websocket/client.js',
    output: {
        path: __dirname,
        filename: 'bundle.js'
    },
    mode: process.env.NODE_ENV,
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
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
            }
        ]
    }
}