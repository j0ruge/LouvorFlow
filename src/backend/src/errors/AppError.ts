export class AppError extends Error {
    public readonly errors?: string[];

    constructor(
        public readonly message: string,
        public readonly statusCode: number = 400,
        errors?: string[]
    ) {
        super(message);
        this.name = 'AppError';
        this.errors = errors;
    }
}
