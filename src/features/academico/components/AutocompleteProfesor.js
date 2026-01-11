import React, { useEffect, useState } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import asignaturasService from '../services/asignaturasService';

export default function AutocompleteProfesor({ value, onChange }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    asignaturasService.listarDocentes()
      .then(res => {
        setOptions(res.data.results || res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Autocomplete
      options={options}
      getOptionLabel={opt => `${opt.first_name || ''} ${opt.last_name || ''}`.trim() || opt.username || ''}
      value={options.find(opt => opt.id === value) || null}
      onChange={(_, newValue) => onChange(newValue ? newValue.id : '')}
      loading={loading}
      renderInput={params => (
        <TextField {...params} label="Profesor" size="small" fullWidth InputProps={{ ...params.InputProps, endAdornment: loading ? <CircularProgress size={16} /> : params.InputProps.endAdornment }} />
      )}
      isOptionEqualToValue={(opt, val) => opt.id === val.id}
    />
  );
}
