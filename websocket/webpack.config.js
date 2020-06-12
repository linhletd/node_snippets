const dotenv = require(dotenv).config();
module.exports = {
    entry: './client.js',
    output: {
        path: __dirname,
        filename: 'bundle.js'
    },
    mode: process.env.NODE_ENV,
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_module/,
                use:{
                    loader: babel-loader,
                    options:{
                        presets: ['@babel/preset-env', '@babel/preset-react'],
                        plugins: [
                            ['@babel/plugin-transform-runtime']
                        ]
                    }
                }
            }
        ]
    }
}