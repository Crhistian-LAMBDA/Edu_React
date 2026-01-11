import React, { useEffect, useState } from 'react';
import { TextField, Autocomplete, CircularProgress } from '@mui/material';
import asignaturasService from '../services/asignaturasService';

export default function AutocompleteAsignatura({ value, onChange }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    asignaturasService.listar()
      .then(res => {
        setOptions(res.data.results || res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Autocomplete
      options={options}
      getOptionLabel={opt => `${opt.codigo} - ${opt.nombre}`}
      value={options.find(opt => opt.id === value) || null}
      onChange={(_, newValue) => onChange(newValue ? newValue.id : '')}
      loading={loading}
      sx={{ width: { xs: '100%', sm: 400, md: 500, lg: 600 }, maxWidth: '100%' }}
      renderInput={params => (
        <TextField {...params} label="Asignatura" size="small" sx={{ width: '100%' }} InputProps={{ ...params.InputProps, endAdornment: loading ? <CircularProgress size={16} /> : params.InputProps.endAdornment }} />
      )}
      slotProps={{
        popper: {
          modifiers: [
            {
              name: 'setPopperWidth',
              enabled: true,
              phase: 'beforeWrite',
              requires: ['computeStyles'],
              fn: ({ state }) => {
                state.styles.popper.width = `${state.rects.reference.width}px`;
              },
            },
          ],
        },
      }}
      isOptionEqualToValue={(opt, val) => opt.id === val.id}
    />
  );
}
