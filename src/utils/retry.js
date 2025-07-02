async function retryWithBackoff(fn, retries = 3, baseDelay = 1000, jitter = true) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn(); // Attempt
        } catch (error) {
            if (attempt === retries) {
                throw error;
            }

            // Calculate the delay with exponential backoff & jitter
            let delay = baseDelay * Math.pow(2, attempt - 1);
            if (jitter) {
                const randomFactor = Math.random() * delay * 0.5;
                delay += randomFactor;
            }

            console.error(`Attempt ${attempt} failed. Retrying in ${Math.round(delay)}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

module.exports = {
    retryWithBackoff,
};