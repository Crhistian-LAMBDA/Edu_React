import React, { useState } from 'react';
import gestionEntregasService from '../services/gestionEntregasService';
import {
  Box, Typography, Button, TextField, Accordion, AccordionSummary, AccordionDetails, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Alert, Chip, IconButton, Tooltip, Badge, Container, Stack, Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import GradeIcon from '@mui/icons-material/Grade';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AutocompleteAsignatura from '../components/AutocompleteAsignatura';
import AutocompletePeriodo from '../components/AutocompletePeriodo';
import AutocompleteProfesor from '../components/AutocompleteProfesor';
import { entregasStyles } from '../../usuarios/pages/entregasStyles';
import { toAbsoluteBackendUrl } from '../../../core/config/apiConfig';

export default function GestionEntregasPage() {
  const [params, setParams] = useState({ asignatura_id: '', horario: '', periodo_id: '', profesor_id: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setParams({ ...params, [e.target.name]: e.target.value });
  };

  const handleBuscar = async () => {
    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await gestionEntregasService.listarEntregasPorGrupo(params);
      setData(res.data);
    } catch (err) {
      setError('No se pudo obtener la información.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h5" gutterBottom>Gestión de Entregas por Grupo</Typography>
          <Typography variant="body2" color="text.secondary">
            Filtra por asignatura, período, profesor y/o horario.
          </Typography>
        </Box>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <AutocompleteAsignatura value={params.asignatura_id} onChange={id => setParams({ ...params, asignatura_id: id })} />
            <AutocompletePeriodo value={params.periodo_id} onChange={id => setParams({ ...params, periodo_id: id })} />
            <AutocompleteProfesor value={params.profesor_id} onChange={id => setParams({ ...params, profesor_id: id })} />
            <TextField label="Horario" name="horario" value={params.horario} onChange={handleChange} size="small" />
            <Button variant="contained" onClick={handleBuscar} sx={{ minWidth: 120 }}>Buscar</Button>
          </Box>
        </Paper>

        {loading && <CircularProgress />}
        {error && <Alert severity="error">{error}</Alert>}
        {data && (
          <Accordion defaultExpanded sx={entregasStyles.acordeon}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" width="100%" justifyContent="space-between" gap={2}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {data.asignatura.codigo} - {data.asignatura.nombre}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Horario: {data.horario || '-'} | Periodo: {data.periodo_id || '-'}
                  </Typography>
                </Box>
                <Badge color="primary" badgeContent={data.estudiantes.length + ' estudiantes'} sx={{ ml: 2 }} />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
            <Table size="small">
              <TableHead sx={entregasStyles.tableHead}>
                <TableRow>
                  <TableCell>Estudiante</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Entregas</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.estudiantes.map(est => (
                  <TableRow key={est.id} sx={entregasStyles.tableRow}>
                    <TableCell sx={entregasStyles.estudiante}>{est.nombre}</TableCell>
                    <TableCell>{est.username}</TableCell>
                    <TableCell>{est.email}</TableCell>
                    <TableCell>
                      {est.entregas.length === 0 ? (
                        <Chip label="Sin entregas" size="small" color="default" />
                      ) : (
                        <Table size="small" sx={{ background: 'transparent', boxShadow: 'none' }}>
                          <TableHead>
                            <TableRow>
                              <TableCell>Título</TableCell>
                              <TableCell>Estado</TableCell>
                              <TableCell>Archivo</TableCell>
                              <TableCell>Calificación</TableCell>
                              <TableCell align="center">Acciones</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {est.entregas.map(ent => (
                              <TableRow key={ent.tarea_id}>
                                <TableCell>{ent.tarea_titulo}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={ent.estado}
                                    sx={ent.estado === 'entregado' ? entregasStyles.chipEntregado : entregasStyles.chipPendiente}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  {ent.archivo ? (
                                    <Tooltip title="Descargar archivo">
                                      <IconButton component="a" href={toAbsoluteBackendUrl(ent.archivo)} target="_blank" rel="noopener noreferrer" size="small" color="primary">
                                        <DownloadIcon />
                                      </IconButton>
                                    </Tooltip>
                                  ) : <Chip label="Sin archivo" size="small" color="default" />}
                                </TableCell>
                                <TableCell>
                                  <Chip label={ent.calificacion || '-'} color={ent.calificacion ? 'success' : 'default'} size="small" />
                                </TableCell>
                                <TableCell align="center" sx={entregasStyles.acciones}>
                                  <Tooltip title="Ver detalles">
                                    <IconButton color="primary" size="small">
                                      <VisibilityIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Calificar">
                                    <IconButton color="secondary" size="small">
                                      <GradeIcon />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionDetails>
        </Accordion>
      )}
      </Stack>
    </Container>
  );
}
