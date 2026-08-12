package com.backend.feni.exception;

public class UnbalancedJournalException extends RuntimeException {
    public UnbalancedJournalException(String message) {
        super(message);
    }
}