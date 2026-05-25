package br.com.academia.faceaccess.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "evento_acesso")
public class EventoAcesso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventoResultado resultado;

    @Enumerated(EnumType.STRING)
    private EventoMotivo motivo;

    @Column(precision = 5, scale = 4)
    private BigDecimal confianca;

    @Column(name = "ocorrido_em", nullable = false)
    private Instant ocorridoEm = Instant.now();

    @Column(name = "cooldown_key", length = 64)
    private String cooldownKey;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public EventoResultado getResultado() {
        return resultado;
    }

    public void setResultado(EventoResultado resultado) {
        this.resultado = resultado;
    }

    public EventoMotivo getMotivo() {
        return motivo;
    }

    public void setMotivo(EventoMotivo motivo) {
        this.motivo = motivo;
    }

    public BigDecimal getConfianca() {
        return confianca;
    }

    public void setConfianca(BigDecimal confianca) {
        this.confianca = confianca;
    }

    public Instant getOcorridoEm() {
        return ocorridoEm;
    }

    public void setOcorridoEm(Instant ocorridoEm) {
        this.ocorridoEm = ocorridoEm;
    }

    public String getCooldownKey() {
        return cooldownKey;
    }

    public void setCooldownKey(String cooldownKey) {
        this.cooldownKey = cooldownKey;
    }
}
