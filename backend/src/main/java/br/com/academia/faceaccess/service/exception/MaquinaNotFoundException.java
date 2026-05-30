package br.com.academia.faceaccess.service.exception;

public class MaquinaNotFoundException extends RuntimeException {

    public MaquinaNotFoundException(Long id) {
        super("Máquina não encontrada: " + id);
    }
}
