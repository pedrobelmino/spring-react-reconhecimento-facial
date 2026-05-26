package br.com.academia.faceaccess.web;

import br.com.academia.faceaccess.service.exception.ClienteNotFoundException;
import br.com.academia.faceaccess.service.exception.DuplicateCpfException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DuplicateCpfException.class)
    ResponseEntity<Map<String, String>> handleDuplicateCpf() {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "CPF já cadastrado"));
    }

    @ExceptionHandler(ClienteNotFoundException.class)
    ResponseEntity<Map<String, String>> handleNotFound(ClienteNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .orElse("Dados inválidos");
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }
}
