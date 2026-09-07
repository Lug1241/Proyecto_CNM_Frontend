import { ClipboardList } from 'lucide-react';

const TableRow = ({ docente,  onViewGrades }) => {
    return (
        <tr style={{ backgroundColor: '#e9ecef', color: '#333', borderBottom: '1px solid #dee2e6' }}>
            <td style={{ padding: '10px', border: '1px solid #ced4da' }}>{docente.nroCedula}</td>
            <td style={{ padding: '10px', border: '1px solid #ced4da' }}>{docente.primer_nombre}</td>
            <td style={{ padding: '10px', border: '1px solid #ced4da' }}>{docente.primer_apellido}</td>
            <td style={{ padding: '10px', border: '1px solid #ced4da' }}>{docente.segundo_nombre}</td>
            <td style={{ padding: '10px', border: '1px solid #ced4da' }}>{docente.segundo_apellido}</td>
            <td style={{ padding: '10px', border: '1px solid #ced4da' }}>{docente.email}</td>
            <td style={{ padding: '10px', border: '1px solid #ced4da' }}>{docente.celular}</td>
            <td style={{ padding: '10px', border: '1px solid #ced4da' }}>{docente.rol || 'Profesor'}</td>
            <td style={{ padding: '10px', border: '1px solid #ced4da' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>

                    <button
                        onClick={() => onViewGrades(docente)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#198754', padding: 0 }}
                        title="Ver calificaciones"
                    >
                        <ClipboardList size={20} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default TableRow;