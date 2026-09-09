/**
 * Los inputs del formulario hablan en hora de Guatemala y en dos campos separados
 * (fecha y hora); el dominio habla en instantes. Aquí vive la traducción en las dos
 * direcciones, para que el desfase esté escrito una sola vez.
 *
 * Guatemala no aplica horario de verano, así que el desfase es fijo todo el año.
 */
const OFFSET_MINUTES = -6 * 60;

const pad = (value: number): string => String(value).padStart(2, "0");

const OFFSET = `${OFFSET_MINUTES < 0 ? "-" : "+"}${pad(
  Math.floor(Math.abs(OFFSET_MINUTES) / 60),
)}:${pad(Math.abs(OFFSET_MINUTES) % 60)}`;

export const localDateTime = (day: string, time: string): Date =>
  new Date(`${day}T${time}:00.000${OFFSET}`);

/**
 * Inverso de localDateTime. Desplaza el instante y lee en UTC en vez de usar los
 * getters locales, que darían la hora de quien mira y no la de Guatemala.
 */
export const localDateTimeFields = (date: Date): { day: string; time: string } => {
  const local = new Date(date.getTime() + OFFSET_MINUTES * 60_000);
  return {
    day: `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}`,
    time: `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`,
  };
};
