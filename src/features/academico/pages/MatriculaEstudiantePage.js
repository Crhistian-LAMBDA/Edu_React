import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Paper, Button, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Container, Stack
} from '@mui/material';
import matriculasService from '../services/matriculasService';
import asignaturasService from '../services/asignaturasService';
import { useSearch } from '../../../shared/context/SearchContext';

export default function MatriculaEstudiantePage() {
  const { searchTerm } = useSearch();
  const [asignaturas, setAsignaturas] = useState([]);
  const [matriculadas, setMatriculadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    cargarAsignaturas();
    cargarMatriculas();
  }, []);

  const cargarAsignaturas = async () => {
    try {
      const res = await asignaturasService.listar();
      setAsignaturas(res.data.results || res.data);
    } catch {
      setAsignaturas([]);
    }
  };

  const cargarMatriculas = async () => {
    setLoading(true);
    try {
      const res = await matriculasService.listar();
      setMatriculadas(res.data);
    } catch {
      setMatriculadas([]);
    } finally {
      setLoading(false);
    }
  };

  const estaMatriculada = (asignaturaId) =>
    matriculadas.some((m) => m.asignatura === asignaturaId);

  const matricular = async (asignaturaId, periodo) => {
    try {
      await matriculasService.crear({ asignatura: asignaturaId, periodo });
      setMessage({ type: 'success', text: 'Matrícula realizada con éxito' });
      cargarMatriculas();
    } catch {
      setMessage({ type: 'error', text: 'No se pudo matricular' });
    }
  };

  const asignaturasFiltradas = useMemo(() => {
    if (!searchTerm?.trim()) return asignaturas;
    const term = searchTerm.toLowerCase();
    return asignaturas.filter((a) => {
      const codigo = (a?.codigo || a?.cod_asignatura || '').toString().toLowerCase();
      const nombre = (a?.nombre || a?.nom_asignatura || '').toString().toLowerCase();
      return (
        codigo.includes(term) ||
        nombre.includes(term) ||
        a?.id?.toString().includes(term)
      );
    });
  }, [asignaturas, searchTerm]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6" gutterBottom>Mis Matrículas</Typography>
          {message.text && <Alert severity={message.type}>{message.text}</Alert>}
        </Box>
        <Paper variant="outlined" sx={{ p: 2 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Código</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Acción</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {asignaturasFiltradas.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.codigo || a.cod_asignatura}</TableCell>
                      <TableCell>{a.nombre || a.nom_asignatura}</TableCell>
                      <TableCell>
                        {estaMatriculada(a.id) ? (
                          <Button variant="outlined" color="success" disabled>
                            Matriculada
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            onClick={() => matricular(a.id, a.periodo_academico)}
                            color="primary"
                          >
                            Matricular
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}
