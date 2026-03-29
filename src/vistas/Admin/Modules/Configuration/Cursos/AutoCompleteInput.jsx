import React, { useState, useEffect } from "react";
import '../../../Styles/AutoCompleteInput.css'
const AutoCompleteInput = ({ opciones, inputValue, setInputValue, key1, key2, placeholder = "Escribe algo..." }) => {
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [input,setInput]=useState("")
 
  // Función que maneja el cambio en el input
  useEffect(()=>{
    if(inputValue){
      setInput(`${inputValue[key1]} ${inputValue[key2]}`)
    }

  },[inputValue,key1,key2])
  
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);

    if (value.trim() === "") {
      setFilteredOptions([]);
      setShowSuggestions(false);
      return;
    }
    // Filtramos todas las opciones cada vez que el usuario escribe
    const matches = opciones.filter((opcion) =>
      `${opcion[key1]} ${opcion[key2]}`
        .toLowerCase()
        .includes(value.toLowerCase())
    );
    setFilteredOptions(matches);
    setShowSuggestions(matches.length > 0);
  };

  // Función que maneja el clic en una opción
  const handleOptionClick = (opcion) => {
    setInput(`${opcion[key1]} ${opcion[key2]}`);
    setInputValue(opcion)

    setFilteredOptions([]);
    setShowSuggestions(false);
  };

  // Función para manejar el clic fuera del input
  const handleClickOutside = (e) => {
    if (!e.target.closest(".autocomplete-container")) {
      setShowSuggestions(false);
    }
  };

  // Hook para detectar el clic fuera del componente
  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div className="autocomplete-container">
      <input
        type="text"
        value={input}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="autocomplete-input"
      />
      {showSuggestions && (
        <ul className="suggestions-list">
          {filteredOptions.map((opcion, index) => (
            <li
              key={index}
              onClick={() => handleOptionClick(opcion)}
              className="suggestion-item"
            >
              {`${opcion[key1]} ${opcion[key2]}`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AutoCompleteInput;



