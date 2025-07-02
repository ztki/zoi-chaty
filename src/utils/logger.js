const isDebug = process.env.DEBUG === 'true';

function logDebug(message) {
    if (isDebug) {
        console.log(`[DEBUG] ${message}`);
    }
}

function logInfo(message) {
    console.log(`[INFO] ${message}`);
}

function logError(message) {
    console.error(`[ERROR] ${message}`);
}

module.exports = {
    logDebug,
    logInfo,
    logError,
};