package br.com.academia.faceaccess.web.dto;

import br.com.academia.faceaccess.domain.EventoMotivo;
import br.com.academia.faceaccess.domain.EventoResultado;

public record RecognizeResponse(
        EventoResultado outcome,
        EventoMotivo motivo,
        Long clienteId,
        String nome,
        String fotoUrl,
        boolean eventoRegistrado,
        double confianca,
        int faceCount) {}
