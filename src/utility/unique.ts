import { QueryFailedError } from "typeorm";

// this funtion help to check this error 
// occur for unique constraint violation
export function isUniqueViolation(err: unknown) {
    if (!(err instanceof QueryFailedError))
        return false;

    // Postgres: 23505
    // MySQL: ER_DUP_ENTRY (code 'ER_DUP_ENTRY', errno 1062)
    // SQLite: SQLITE_CONSTRAINT / SQLITE_CONSTRAINT_UNIQUE
    const e: any = err;
    return (
        e?.code === "23505" ||
        e?.code === "ER_DUP_ENTRY" ||
        e?.errno === 1062 ||
        e?.code === "SQLITE_CONSTRAINT" ||
        e?.code === "SQLITE_CONSTRAINT_UNIQUE"
    );
}
