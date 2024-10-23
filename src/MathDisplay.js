import React from 'react';
import { MathJaxContext, MathJax } from 'better-react-mathjax';

const MathDisplay = ({ expression }) => {
  return (
    <MathJaxContext>
      <div>
        {expression ? (
          <MathJax dynamic={true}>
            {`\\(${expression}\\)`}
          </MathJax>
        ) : (
          <p>Ingrese una función para visualizar.</p>
        )}
      </div>
    </MathJaxContext>
  );
};

export default MathDisplay;
