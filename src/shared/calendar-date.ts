/**
 * Una fecha de calendario: el día, sin hora y sin zona horaria. «Las clases empiezan el 20
 * de septiembre» es igual de cierto en Guatemala que en Tokio, así que representarla con un
 * `Date` —que es un instante— la mueve un día en cuanto alguien la convierte de zona.
 *
 * El formato es el mismo que hablan los `<input type="date">`, de modo que el valor viaja
 * intacto desde el formulario hasta la base de datos.
 */
export type CalendarDate = string;

const pad = (value: number): string => String(value).padStart(2, "0");

/** Lee el día de un instante en UTC. Para columnas `@db.Date`, que Prisma devuelve a las 00:00Z. */
export const toCalendarDate = (date: Date): CalendarDate =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

/** Inverso de toCalendarDate: medianoche UTC, que es lo que una columna `@db.Date` guarda. */
export const fromCalendarDate = (day: CalendarDate): Date => new Date(`${day}T00:00:00.000Z`);

const formatter = new Intl.DateTimeFormat("es-GT", {
  timeZone: "UTC",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * La única forma de mostrar una fecha de calendario. Fija la zona en UTC para deshacer
 * exactamente lo que hizo fromCalendarDate, en vez de llevar el día a otra zona.
 */
export const formatCalendarDate = (day: CalendarDate): string =>
  formatter.format(fromCalendarDate(day));
