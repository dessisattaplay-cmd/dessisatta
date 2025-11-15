import React, { useState } from 'react';
import { useLocalization } from './useLocalization';

export interface FormValidation<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isFormValid: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (callback: (values: T) => void) => (e: React.FormEvent) => void;
  setValues: React.Dispatch<React.SetStateAction<T>>;
}

const useForm = <T extends Record<string, any>>(
  initialValues: T,
  validate: (values: T, t: (key: string, options?: Record<string, string | number>) => string) => Partial<Record<keyof T, string>>
): FormValidation<T> => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const { t } = useLocalization();

  const validationErrors = validate(values, t);
  const isFormValid = Object.keys(validationErrors).length === 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: value,
    });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched({
      ...touched,
      [name]: true,
    });
    setErrors(validate(values, t));
  };
  
  const handleSubmit = (callback: (values: T) => void) => (e: React.FormEvent) => {
    e.preventDefault();
    const currentErrors = validate(values, t);
    setErrors(currentErrors);
    setTouched(Object.keys(values).reduce((acc, key) => ({...acc, [key]: true}), {} as Partial<Record<keyof T, boolean>>));
    if (Object.keys(currentErrors).length === 0) {
        callback(values);
    }
  };

  return {
    values,
    errors,
    touched,
    isFormValid,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
  };
};

export default useForm;