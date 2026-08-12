package com.backend.feni.exception;

import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Bad input from the client — bad SKU, unknown user, duplicate username, etc.
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    // Business-rule violations — e.g. unbalanced journal entry
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException ex) {
        return buildResponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    // Our own domain exception for journal validation
    @ExceptionHandler(UnbalancedJournalException.class)
    public ResponseEntity<Map<String, Object>> handleUnbalancedJournal(UnbalancedJournalException ex) {
        return buildResponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    // Bean Validation failures — @Valid on @RequestBody DTOs
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(err ->
                fieldErrors.put(err.getField(), err.getDefaultMessage())
        );

        Map<String, Object> body = baseBody(HttpStatus.BAD_REQUEST, "Validation failed");
        body.put("fieldErrors", fieldErrors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    // Login failures — wrong username/password
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        return buildResponse(HttpStatus.UNAUTHORIZED, "Invalid username or password");
    }

    // Authenticated, but role doesn't permit this action (e.g. Bartender hitting /api/admin/**)
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return buildResponse(HttpStatus.FORBIDDEN, "You do not have permission to perform this action");
    }

    // DB-level constraint violations that slip past manual checks (e.g. race condition on unique username)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex) {
        return buildResponse(HttpStatus.CONFLICT, "A record with conflicting data already exists");
    }

    // Catch-all safety net — never leak stack traces to the client
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
    }

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(baseBody(status, message));
    }

    private Map<String, Object> baseBody(HttpStatus status, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        return body;
    }
}


//Now swap this into PosSaleService's validateBalanced() instead of the generic IllegalStateException:
//
//java
//private void validateBalanced(JournalEntry entry) {
//    BigDecimal debits = sumByType(entry, EntryType.DEBIT);
//    BigDecimal credits = sumByType(entry, EntryType.CREDIT);
//    if (debits.compareTo(credits) != 0) {
//        throw new UnbalancedJournalException(
//                "Journal entry does not balance: " + debits + " debits vs " + credits + " credits"
//        );
//    }
//}



//A few decisions worth flagging:
//
//@RestControllerAdvice, not @ControllerAdvice — this matters because @RestControllerAdvice automatically serializes the return value as JSON (it's @ControllerAdvice + @ResponseBody combined). Using plain @ControllerAdvice here would try to resolve a view template and fail, since this is a pure API with no views.
//        The catch-all Exception.class handler is deliberately vague ("An unexpected error occurred") — this is your last line of defense against leaking internal details (SQL, stack traces, file paths) to a tablet UI or, worse, to whatever hits your API from outside. Log the real exception server-side (add a log.error("Unhandled exception", ex) line — I left it out for brevity, but add it) so you can debug, while the client only ever sees a generic message.
//IllegalArgumentException → 400, IllegalStateException/UnbalancedJournalException → 409 (Conflict) — this distinction matters semantically: a bad SKU is a client input error (400), but an unbalanced journal is "the request was well-formed but violates a business invariant" (409 fits better than 400 here).