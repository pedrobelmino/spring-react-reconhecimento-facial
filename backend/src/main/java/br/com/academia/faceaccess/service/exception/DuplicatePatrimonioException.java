package br.com.academia.faceaccess.service.exception;

public class DuplicatePatrimonioException extends RuntimeException {

    public DuplicatePatrimonioException() {
        super("Código de patrimônio já cadastrado");
    }
}
