package br.com.academia.faceaccess.service.exception;

public class DuplicateCpfException extends RuntimeException {

    public DuplicateCpfException() {
        super("CPF já cadastrado");
    }
}
