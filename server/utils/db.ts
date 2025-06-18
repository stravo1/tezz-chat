const MAX_RETRIES = 5;
const DB_OPERATION_TIMEOUT = 10000; // 10 seconds

export const withRetry = async <T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  timeout = DB_OPERATION_TIMEOUT
): Promise<T> => {
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), timeout);
    });
    return (await Promise.race([operation(), timeoutPromise])) as T;
  } catch (error) {
    console.error('Operation failed:', error);
    if (retries > 0) {
      console.log(`Retrying operation, ${retries} attempts left`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      return withRetry(operation, retries - 1, timeout);
    }
    throw error;
  }
};
