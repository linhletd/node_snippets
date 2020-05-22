module.exports = {
    entry: './jwt/client.js',
    output: {
        filename: 'bundle.js',
        path: __dirname
    },
    mode: 'development',
    module:{
        rules:[
            {
                test: /\.js$/,
                exclude: /node_module/,
                use: {
                    loader: 'babel-loader',
                    options:{
                        presets:['@babel/preset-env', '@babel/preset-react'],
                        plugins: [
                            ['@babel/plugin-transform-runtime']
                        ]
                    }
                }
            }
        ]
    }
}