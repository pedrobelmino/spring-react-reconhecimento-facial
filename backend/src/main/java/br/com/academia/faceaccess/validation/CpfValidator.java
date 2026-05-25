package br.com.academia.faceaccess.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class CpfValidator implements ConstraintValidator<CpfValid, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return true;
        }
        return isValidCpf(value);
    }

    static boolean isValidCpf(String cpf) {
        String digits = cpf.replaceAll("\\D", "");
        if (digits.length() != 11) {
            return false;
        }
        if (digits.chars().distinct().count() == 1) {
            return false;
        }

        int firstDigit = calculateVerifierDigit(digits.substring(0, 9), 10);
        int secondDigit = calculateVerifierDigit(digits.substring(0, 9) + firstDigit, 11);

        return digits.charAt(9) == Character.forDigit(firstDigit, 10)
                && digits.charAt(10) == Character.forDigit(secondDigit, 10);
    }

    private static int calculateVerifierDigit(String base, int factorStart) {
        int sum = 0;
        int factor = factorStart;
        for (int i = 0; i < base.length(); i++) {
            sum += Character.getNumericValue(base.charAt(i)) * factor--;
        }
        int remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    }
}
