package br.com.academia.faceaccess.service.exception;

public class AcompanhamentoNotFoundException extends RuntimeException {

    public AcompanhamentoNotFoundException(Long id) {
        super("Acompanhamento nutricional não encontrado: " + id);
    }
}
