import React, { useState } from 'react';
import './App.css';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { MathJaxContext, MathJax } from 'better-react-mathjax';

function App() {
  // Defino los estados que voy a necesitar para almacenar los valores de la expresión, límites, resultados, etc.
  const [expression, setExpression] = useState(''); // Para la función que el usuario ingresa
  const [lowerLimit, setLowerLimit] = useState(''); // Para el límite inferior (si aplica)
  const [upperLimit, setUpperLimit] = useState(''); // Para el límite superior (si aplica)
  const [resultIndefinite, setResultIndefinite] = useState(''); // Resultado de la integral indefinida
  const [resultDefined, setResultDefined] = useState(''); // Resultado de la integral definida
  const [steps, setSteps] = useState([]); // Pasos de la solución paso a paso
  const [imageUrl, setImageUrl] = useState(null); // URL para la imagen generada de la gráfica
  const [error, setError] = useState(''); // Para mostrar errores al usuario

  // Esta función transforma la expresión matemática para hacerla compatible con la API, reemplazando los símbolos necesarios
  const transformExpression = (expr) => {
    let transformed = expr.replace(/\^/g, '**'); // Reemplazo el símbolo de potencia ^ por **
    transformed = transformed.replace(/(\d)([a-zA-Z])/g, '$1*$2'); // Inserto el símbolo de multiplicación entre números y variables (ej. 2x => 2*x)
    transformed = transformed.replace(/([a-zA-Z])(\d)/g, '$1*$2'); // Lo mismo pero para el caso inverso (ej. x2 => x*2)
    transformed = transformed.replace(/(\d)\(/g, '$1*('); // Añado multiplicación cuando hay un número seguido de un paréntesis
    transformed = transformed.replace(/\)(\d)/g, ')*$1'); // Añado multiplicación cuando un paréntesis cierra y es seguido por un número
    return transformed; // Devuelvo la expresión transformada
  };

  // Esta función revierte las transformaciones que hice anteriormente, para que el resultado sea más amigable de leer
  const revertExpression = (expr) => {
    let reverted = expr.replace(/\*\*/g, '^'); // Revierto el símbolo de potencia a ^ nuevamente
    reverted = reverted.replace(/(\d)\*/g, '$1'); // Quito los símbolos de multiplicación innecesarios
    reverted = reverted.replace(/\*\(/g, '('); // Quito el símbolo de multiplicación antes de paréntesis
    reverted = reverted.replace(/\*\)/g, ')'); // Lo mismo pero después de paréntesis
    return reverted; // Devuelvo la expresión revertida
  };

  // Esta función maneja el envío de la expresión matemática y los límites a la API
  const handleSubmit = async () => {
    // Valido que si el usuario ingresa un límite, el otro también sea obligatorio
    if ((!lowerLimit && upperLimit) || (lowerLimit && !upperLimit)) {
      setError('Si ingresas uno de los límites, el otro también es obligatorio.');
      return;
    }

    // Verifico que el usuario haya ingresado una expresión matemática
    if (!expression.trim()) {
      setError('Por favor, ingresa una función matemática.');
      return;
    }

    try {
      // Si todo está bien, borro cualquier error previo
      setError('');
      
      // Transformo la expresión antes de enviarla
      const transformedExpression = transformExpression(expression);
      
      // Construyo los datos que voy a enviar a la API
      const requestData = {
        expression: transformedExpression, // Incluyo la expresión transformada
      };

      // Si el usuario ha ingresado límites, los añado a los datos que se enviarán
      if (lowerLimit && upperLimit) {
        requestData.lower_limit = parseFloat(lowerLimit); // Límite inferior
        requestData.upper_limit = parseFloat(upperLimit); // Límite superior
      }

      // Envío los datos a la API para que calcule la integral
      const response = await axios.post('http://127.0.0.1:8000/calculate-integral', requestData);

      // Revierto las expresiones en los resultados de la API para mostrarlas de manera más legible
      const revertedIndefinite = revertExpression(response.data.indefinite_integral);
      const revertedDefined = response.data.defined_integral !== "No se proporcionaron límites" ? revertExpression(response.data.defined_integral) : "No se proporcionaron límites";
      const revertedSteps = response.data.explanation.map(step => revertExpression(step)); // Revierto cada paso

      // Guardo los resultados y pasos en sus respectivos estados
      setResultIndefinite(revertedIndefinite);
      setResultDefined(revertedDefined);
      setSteps(revertedSteps);

      // Ahora obtengo la gráfica generada por la API
      const imageResponse = await axios.get('http://127.0.0.1:8000/get-graph', {
        responseType: 'blob', // Espero la imagen como un blob
      });
      const imageObjectUrl = URL.createObjectURL(imageResponse.data); // Creo una URL para la imagen
      setImageUrl(imageObjectUrl); // La guardo para mostrarla en el frontend
    } catch (error) {
      // Si ocurre un error, lo registro en la consola y lo muestro al usuario
      console.error('Error calculating integral or fetching the graph:', error);
      setError('Ocurrió un error al calcular la integral o al obtener la gráfica.');
    }
  };

  // Esta función limpia todos los campos y estados, como si reiniciara la calculadora
  const handleClear = () => {
    setExpression(''); // Limpio la expresión
    setLowerLimit(''); // Limpio el límite inferior
    setUpperLimit(''); // Limpio el límite superior
    setResultIndefinite(''); // Limpio el resultado indefinido
    setResultDefined(''); // Limpio el resultado definido
    setSteps([]); // Limpio los pasos
    setImageUrl(null); // Quito la imagen
    setError(''); // Quito cualquier error
  };

  return (
    <MathJaxContext>
      <div className="App container mt-5">
        <h1 className="text-center">Calculadora de Integrales</h1>
        
        {/* Sección de ejemplos de funciones para que el usuario pueda seleccionar rápidamente */}
        <div className="card mt-5">
          <div className="card-header bg-primary text-white text-center">
            Ejemplos Matemáticos
          </div>
          <div className="card-body">
            <div className="d-flex flex-wrap justify-content-center">
              {/* Los botones permiten al usuario seleccionar funciones matemáticas comunes */}
              <button className="btn btn-primary m-2" onClick={() => setExpression('2x^2')}>2x^2</button>
              <button className="btn btn-primary m-2" onClick={() => setExpression('ln(x+1)')}>ln(x+1)</button>
              <button className="btn btn-primary m-2" onClick={() => setExpression('1/x')}>1/x</button>
              <button className="btn btn-primary m-2" onClick={() => setExpression('cos(x)')}>cos(x)</button>
              <button className="btn btn-primary m-2" onClick={() => setExpression('tan(x)')}>tan(x)</button>
              <button className="btn btn-primary m-2" onClick={() => setExpression('x^3 + x^2')}>x^3 + x^2</button>
              <button className="btn btn-primary m-2" onClick={() => setExpression('ln(x)')}>ln(x)</button>
              <button className="btn btn-primary m-2" onClick={() => setExpression('x^2 + 2x + 1')}>x^2 + 2x + 1</button>
              <button className="btn btn-primary m-2" onClick={() => setExpression('sin(x)')}>sin(x)</button>
              <button className="btn btn-primary m-2" onClick={() => setExpression('cos(x)')}>cos(x)</button>
              <button className="btn btn-primary m-2" onClick={() => setExpression('1/(x+1)')}>1/(x+1)</button>
            </div>
          </div>
        </div>

        {/* Input para ingresar la función matemática */}
        <div className="input-group mb-3 mt-3">
          <input
            type="text"
            className="form-control"
            placeholder="Ingresa una función matemática"
            value={expression}
            onChange={(e) => setExpression(e.target.value)} // Actualizo el estado conforme el usuario escribe
          />
        </div>

        {/* Inputs para los límites (si el usuario quiere calcular una integral definida) */}
        <div className="input-group mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Límite Inferior"
            value={lowerLimit}
            onChange={(e) => setLowerLimit(e.target.value)} // Actualizo el límite inferior
          />
          <input
            type="text"
            className="form-control ms-2"
            placeholder="Límite Superior"
            value={upperLimit}
            onChange={(e) => setUpperLimit(e.target.value)} // Actualizo el límite superior
          />
        </div>

        {/* Botones para calcular o limpiar la calculadora */}
        <button className="btn btn-primary" onClick={handleSubmit}>Calcular</button>
        <button className="btn btn-danger ms-2" onClick={handleClear}>Limpiar</button>

        {/* Muestro los errores si es que hay alguno */}
        {error && <div className="alert alert-danger mt-3">{error}</div>}

        {/* Renderizado del LaTeX de la función enviada */}
        <h2>Renderizado de la Función:</h2>
        <MathJax dynamic={true}>
          {`\\( \\text{Función enviada: } ${expression} \\)`}
        </MathJax>

        {/* Muestro el resultado de la integral indefinida */}
        <h2>Resultado de la Integral Indefinida:</h2>
        <MathJax dynamic={true}>
          {`\\(${resultIndefinite}\\)`}
        </MathJax>

        {/* Muestro el resultado de la integral definida si se proporcionaron límites */}
        <h2>Resultado de la Integral Definida:</h2>
        <MathJax dynamic={true}>
          {`\\(${resultDefined}\\)`}
        </MathJax>

        {/* Explicación paso a paso de la solución */}
        <h2>Explicación paso a paso:</h2>
        <ul>
          {Array.isArray(steps) && steps.length > 0 ? (
            steps.map((step, index) => (
              <li key={index}>
                <MathJax dynamic={true}>
                  {`\\(${step}\\)`}
                </MathJax>
              </li>
            ))
          ) : (
            <p>No hay explicaciones disponibles.</p>
          )}
        </ul>

        {/* Gráfica de la integral */}
        {imageUrl && (
          <div className="mt-4">
            <h2>Gráfica de la Integral:</h2>
            <img src={imageUrl} alt="Gráfica de la integral" />
          </div>
        )}
      </div>
    </MathJaxContext>
  );
}

export default App;
