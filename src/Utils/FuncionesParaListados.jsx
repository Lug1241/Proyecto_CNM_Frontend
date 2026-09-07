import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export async function exportarListadoAExcel(datosTabla, datosEncabezado, nombreArchivo) {
  // 1. Crear el libro y la hoja de cálculo
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Listado de Estudiantes');

  // 2. Título Principal
  const filaTitulo = worksheet.addRow([datosEncabezado.titulo]);
  filaTitulo.font = { name: 'Arial', size: 14, bold: true };
  worksheet.mergeCells('A1:C1');
  filaTitulo.alignment = { horizontal: 'center' };

  // 3. Subtítulo
  const filaSubtitulo = worksheet.addRow([datosEncabezado.subtitulo]);
  filaSubtitulo.font = { name: 'Arial', size: 12, bold: true };
  worksheet.mergeCells('A2:C2');
  filaSubtitulo.alignment = { horizontal: 'center' };

  worksheet.addRow([]); // Fila vacía para separar

  // 4. Metadatos (Profesor, Asignatura, etc.)
  const infoKeys = Object.keys(datosEncabezado.info);
  const mitad = Math.ceil(infoKeys.length / 2);
  const infoIzq = infoKeys.slice(0, mitad);
  const infoDer = infoKeys.slice(mitad);

  for (let i = 0; i < mitad; i++) {
    const claveIzq = infoIzq[i];
    const valorIzq = datosEncabezado.info[claveIzq];
    const claveDer = infoDer[i];
    const valorDer = claveDer ? datosEncabezado.info[claveDer] : '';

    const filaInfo = worksheet.addRow([
      `${claveIzq}: ${valorIzq}`, 
      '', 
      claveDer ? `${claveDer}: ${valorDer}` : ''
    ]);
    filaInfo.font = { name: 'Arial', size: 10 };
    // Unir A y B para dar más espacio al texto de la izquierda
    worksheet.mergeCells(`A${filaInfo.number}:B${filaInfo.number}`); 
  }

  worksheet.addRow([]); // Fila vacía antes de la tabla

  // 5. Encabezados de la Tabla
  if (datosTabla.length > 0) {
    const columnasTabla = Object.keys(datosTabla[0]);
    const filaEncabezados = worksheet.addRow(columnasTabla);
    
    filaEncabezados.eachCell((celda) => {
      celda.font = { bold: true, color: { argb: '000000' } };
      celda.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'D9E1F2' } // Color azul claro
      };
      celda.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      };
      celda.alignment = { horizontal: 'center' };
    });

    // 6. Datos de la tabla
    datosTabla.forEach((fila) => {
      const valores = columnasTabla.map(col => fila[col]);
      const row = worksheet.addRow(valores);
      
      row.eachCell((celda, colNumber) => {
        celda.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        };
        if (colNumber === 1) { // Centrar la columna "Nro"
          celda.alignment = { horizontal: 'center' };
        }
      });
    });

    // 7. Ajustar el ancho de las columnas
    worksheet.columns = [
      { width: 10 }, // Nro
      { width: 50 }, // Nómina de estudiantes
      { width: 35 }  // Horario (si aplica)
    ];
  }

  // 8. Generar el archivo y descargarlo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, nombreArchivo);
}