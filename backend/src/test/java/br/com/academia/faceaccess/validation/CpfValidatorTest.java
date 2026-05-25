package br.com.academia.faceaccess.validation;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class CpfValidatorTest {

    @Test
    void acceptsValidCpfWithFormatting() {
        assertThat(CpfValidator.isValidCpf("529.982.247-25")).isTrue();
    }

    @Test
    void acceptsValidCpfDigitsOnly() {
        assertThat(CpfValidator.isValidCpf("11144477735")).isTrue();
    }

    @Test
    void rejectsInvalidVerifierDigits() {
        assertThat(CpfValidator.isValidCpf("52998224726")).isFalse();
    }

    @Test
    void rejectsRepeatedDigits() {
        assertThat(CpfValidator.isValidCpf("11111111111")).isFalse();
    }

    @Test
    void rejectsWrongLength() {
        assertThat(CpfValidator.isValidCpf("1234567890")).isFalse();
    }

    @Test
    void rejectsBlankThroughAnnotationValidator() {
        CpfValidator validator = new CpfValidator();
        assertThat(validator.isValid("   ", null)).isTrue();
        assertThat(validator.isValid("00000000000", null)).isFalse();
    }
}
