import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Button, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress
} from '@mui/material';
import matriculasService from '../services/matriculasService';
import asignaturasService from '../services/asignaturasService';

export default function MatriculaEstudiantePage() {
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

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Mis Matrículas</Typography>
      {message.text && <Alert severity={message.type}>{message.text}</Alert>}
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
              {asignaturas.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.codigo}</TableCell>
                  <TableCell>{a.nombre}</TableCell>
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
  );
}
