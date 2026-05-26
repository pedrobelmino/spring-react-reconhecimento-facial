package br.com.academia.faceaccess.service.exception;

public class ClienteNotFoundException extends RuntimeException {

    public ClienteNotFoundException(Long id) {
        super("Cliente não encontrado: " + id);
    }
}
