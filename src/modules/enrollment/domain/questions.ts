export type QuestionId = string;

export type QuestionKind =
  | "commitment"
  | "email"
  | "text"
  | "phone"
  | "document-id"
  | "choice"
  | "department"
  | "municipality"
  | "zone"
  | "language-choice";

export type QuestionOption = {
  readonly value: string;
  readonly labelKaqchikel: string;
  readonly labelSpanish: string;
};

export type Question = {
  readonly id: QuestionId;
  readonly labelKaqchikel: string;
  readonly labelSpanish: string;
  readonly kind: QuestionKind;
  readonly required: boolean;
  readonly hint?: string;
  readonly options?: readonly QuestionOption[];
  readonly dependsOn?: QuestionId;
};

const YES_NO: readonly QuestionOption[] = [
  { value: "yes", labelKaqchikel: "Ja'", labelSpanish: "Sí" },
  { value: "no", labelKaqchikel: "Manäq", labelSpanish: "No" },
];

const LANGUAGE_OPTIONS: readonly QuestionOption[] = [
  { value: "Kaqchikel", labelKaqchikel: "Kaqchikel", labelSpanish: "Kaqchikel" },
  { value: "Castellano", labelKaqchikel: "Kaxlan tzij", labelSpanish: "Castellano" },
];

export const NATIONALITIES: readonly string[] = [
  "Guatemalteca",
  "Beliceña",
  "Costarricense",
  "Cubana",
  "Salvadoreña",
  "Española",
  "Estadounidense",
  "Hondureña",
  "Mexicana",
  "Nicaragüense",
  "Panameña",
  "Otra",
];

export const COMMITMENT_QUESTION_ID = "modality_commitment";

export const BASE_QUESTIONS: readonly Question[] = [
  {
    id: COMMITMENT_QUESTION_ID,
    labelKaqchikel:
      "¿La nawajo' nak'ül ri tijonïk pa re b'eyal re'? Ri tijonïk xtiya' pa ruwi' ri rub'eyal ri xcha'.",
    labelSpanish:
      "El curso se impartirá en la modalidad indicada por la Academia. ¿Se compromete a recibir el curso en dicha modalidad?",
    kind: "commitment",
    required: true,
    options: YES_NO,
  },
  {
    id: "email",
    labelKaqchikel: "Taqoya'l",
    labelSpanish: "Correo electrónico",
    kind: "email",
    required: true,
    hint: "Es el único medio por el que la Academia se comunicará.",
  },
  {
    id: "first_names",
    labelKaqchikel: "Ab'i'",
    labelSpanish: "Nombres",
    kind: "text",
    required: true,
  },
  {
    id: "last_names",
    labelKaqchikel: "Awach'alal b'i'aj",
    labelSpanish: "Apellidos",
    kind: "text",
    required: true,
  },
  {
    id: "document_id",
    labelKaqchikel: "Rajilab'al awujil",
    labelSpanish: "Número de Documento Personal de Identificación (DPI)",
    kind: "document-id",
    required: true,
    hint: "13 dígitos, sin espacios ni guiones.",
  },
  {
    id: "institution_name",
    labelKaqchikel: "Akuchi' yasamäj",
    labelSpanish: "Nombre de la institución donde labora actualmente",
    kind: "text",
    required: false,
  },
  {
    id: "institution_address",
    labelKaqchikel: "Rochochib'al ri akuchi' yasamäj",
    labelSpanish: "Dirección de la institución donde labora",
    kind: "text",
    required: false,
  },
  {
    id: "institution_department",
    labelKaqchikel: "Rub'i' ri tinamital akuchi' yasamäj",
    labelSpanish: "Departamento donde se ubica la institución",
    kind: "department",
    required: false,
  },
  {
    id: "institution_municipality",
    labelKaqchikel: "Rub'i' ri tinamït akuchi' yasamäj",
    labelSpanish: "Municipio donde se ubica la institución",
    kind: "municipality",
    required: false,
    dependsOn: "institution_department",
  },
  {
    id: "residence_department",
    labelKaqchikel: "Rub'i' ri atinamital",
    labelSpanish: "Departamento donde vive actualmente",
    kind: "department",
    required: true,
  },
  {
    id: "residence_municipality",
    labelKaqchikel: "Rub'i' ri atinamit akuchi' at k'äs",
    labelSpanish: "Municipio donde vive actualmente",
    kind: "municipality",
    required: true,
    dependsOn: "residence_department",
  },
  {
    id: "residence_zone",
    labelKaqchikel: "Rub'i' ri k'ojlib'äl",
    labelSpanish: "Zona",
    kind: "zone",
    required: false,
    dependsOn: "residence_municipality",
  },
  {
    id: "home_address",
    labelKaqchikel: "Awochochib'al",
    labelSpanish: "Dirección de domicilio",
    kind: "text",
    required: true,
    hint: "Ejemplo: Calle principal, Aldea El Tesoro, Tecpán Guatemala.",
  },
  {
    id: "phone",
    labelKaqchikel: "Rajilab'al awoyonib'al",
    labelSpanish: "Número de teléfono",
    kind: "phone",
    required: true,
  },
  {
    id: "sex",
    labelKaqchikel: "Rukojolil winäq",
    labelSpanish: "Sexo",
    kind: "choice",
    required: true,
    options: [
      { value: "female", labelKaqchikel: "Ixöq", labelSpanish: "Femenino" },
      { value: "male", labelKaqchikel: "Achi", labelSpanish: "Masculino" },
    ],
  },
  {
    id: "ethnic_group",
    labelKaqchikel: "Ab'anob'al",
    labelSpanish: "Pueblo al que pertenece",
    kind: "choice",
    required: true,
    options: [
      { value: "maya", labelKaqchikel: "Maya", labelSpanish: "Maya" },
      { value: "garifuna", labelKaqchikel: "Garífuna", labelSpanish: "Garífuna" },
      { value: "xinka", labelKaqchikel: "Xinka", labelSpanish: "Xinka" },
      { value: "ladino", labelKaqchikel: "Ladino", labelSpanish: "Ladino" },
      { value: "other", labelKaqchikel: "Ch'aqa chik", labelSpanish: "Otro" },
    ],
  },
  {
    id: "nationality",
    labelKaqchikel: "Tacha' qa jun amaq'el",
    labelSpanish: "Nacionalidad",
    kind: "choice",
    required: true,
    options: NATIONALITIES.map((name) => ({
      value: name,
      labelKaqchikel: name,
      labelSpanish: name,
    })),
  },
  {
    id: "age_range",
    labelKaqchikel: "Ajuna'",
    labelSpanish: "Rango de edad",
    kind: "choice",
    required: true,
    options: [
      { value: "from_14_to_30", labelKaqchikel: "14 - 30 juna'", labelSpanish: "14 a 30 años" },
      { value: "from_31_to_60", labelKaqchikel: "31 - 60 juna'", labelSpanish: "31 a 60 años" },
      { value: "over_60", labelKaqchikel: "Ikäl chi re 60 juna'", labelSpanish: "Más de 60 años" },
    ],
  },
  {
    id: "disability",
    labelKaqchikel: "¿La k'o jun k'ayewal pan ach'akul?",
    labelSpanish: "¿Tiene usted alguna discapacidad física?",
    kind: "choice",
    required: true,
    options: YES_NO,
  },
  {
    id: "occupation",
    labelKaqchikel: "Asamaj",
    labelSpanish: "Profesión u oficio",
    kind: "text",
    required: true,
  },
  {
    id: "mother_tongue",
    labelKaqchikel: "Nab'ey ach'ab'äl",
    labelSpanish: "Lengua materna",
    kind: "language-choice",
    required: true,
    options: LANGUAGE_OPTIONS,
    hint: "Si es otra, escríbala; si son varias, sepárelas con comas.",
  },
  {
    id: "second_language",
    labelKaqchikel: "Ruka'n ach'ab'äl",
    labelSpanish: "Segunda lengua",
    kind: "language-choice",
    required: true,
    options: LANGUAGE_OPTIONS,
    hint: "Si es otra, escríbala; si son varias, sepárelas con comas.",
  },
  {
    id: "kaqchikel_proficiency",
    labelKaqchikel: "Awetamab'al pa ruwi' ri Kaqchikel ch'ab'äl",
    labelSpanish: "Nivel de dominio del idioma Kaqchikel",
    kind: "choice",
    required: true,
    options: [
      { value: "speaks", labelKaqchikel: "Nich'o", labelSpanish: "Habla" },
      {
        value: "speaks_reads",
        labelKaqchikel: "Nich'o chuqa' nusik'ij",
        labelSpanish: "Habla y lee",
      },
      {
        value: "speaks_reads_writes",
        labelKaqchikel: "Nich'o, nusik'ij chuqa' nutz'ib'aj",
        labelSpanish: "Habla, lee y escribe",
      },
    ],
  },
];
