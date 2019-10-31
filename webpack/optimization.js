module.exports = {
    splitChunks: {
        cacheGroups: {
            commons: {
                chunks: 'initial',
                minChunks: 2,
                maxInitialRequests: 5, // The default limit is too small to showcase the effect
                minSize: 0 // This is example is too small to create commons chunks
            }
        }
    }
};
