import React, { useEffect, useState } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import asignaturasService from '../services/asignaturasService';

export default function AutocompletePeriodo({ value, onChange }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    asignaturasService.listarPeriodos()
      .then(res => {
        setOptions(res.data.results || res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Autocomplete
      options={options}
      getOptionLabel={opt => opt.nombre || ''}
      value={options.find(opt => opt.id === value) || null}
      onChange={(_, newValue) => onChange(newValue ? newValue.id : '')}
      loading={loading}
      sx={{ width: { xs: '100%', sm: 320, md: 400, lg: 500 }, maxWidth: '100%' }}
      renderInput={params => (
        <TextField
          {...params}
          label="Período"
          size="small"
          sx={{ width: '100%' }}
          InputProps={{ ...params.InputProps, endAdornment: loading ? <CircularProgress size={16} /> : params.InputProps.endAdornment }}
        />
      )}
      isOptionEqualToValue={(opt, val) => opt.id === val.id}
    />
  );
}
