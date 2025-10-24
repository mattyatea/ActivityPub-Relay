export function useApiError() {
	const getErrorMessage = (error: unknown): string => {
		if (error instanceof Error) return error.message;
		if (typeof error === 'object' && error !== null && 'message' in error) {
			return String(error.message);
		}
		return 'Unknown error occurred';
	};

	const getErrorType = (error: unknown): 'error' | 'warning' => {
		const statusCode = getStatusCode(error);
		const errorTypes: Record<number, 'error' | 'warning'> = {
			400: 'warning', // Bad request
			401: 'error', // Authentication
			403: 'error', // Authorization
			500: 'error', // Server error
		};
		return errorTypes[statusCode] ?? 'error';
	};

	const getStatusCode = (error: unknown): number => {
		if (typeof error === 'object' && error !== null && 'status' in error) {
			return Number(error.status);
		}
		return 0;
	};

	const isAuthError = (error: unknown): boolean => {
		return getStatusCode(error) === 401;
	};

	return {
		getErrorMessage,
		getErrorType,
		getStatusCode,
		isAuthError,
	};
}
