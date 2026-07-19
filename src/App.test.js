import { isSharkRelated, filterSharks, normalize } from "./sharkFilter";
import {
  buildTitleUrl,
  isAdultRating,
  formatRuntime,
  titleOf,
  yearOf,
  getCertification,
} from "./api";
import { t, setUiLang } from "./i18n";

describe("Filtro de tiburones", () => {
  test("bloquea películas de tiburones", () => {
    expect(isSharkRelated({ title: "Jaws" })).toBe(true);
    expect(isSharkRelated({ title: "Deep Water" })).toBe(true);
    expect(isSharkRelated({ title: "Tiburón" })).toBe(true);
    expect(
      isSharkRelated({ title: "Megalodón", original_title: "The Meg" })
    ).toBe(true);
  });
  test("permite películas normales aunque el nombre se parezca", () => {
    expect(isSharkRelated({ title: "Moana" })).toBe(false);
    expect(
      isSharkRelated({ title: "Megamente", original_title: "Megamind" })
    ).toBe(false);
  });
  test("filterSharks quita solo las de tiburones", () => {
    const list = [
      { id: 1, title: "Jaws" },
      { id: 2, title: "Moana" },
    ];
    expect(filterSharks(list)).toEqual([{ id: 2, title: "Moana" }]);
  });
});

describe("URL del enlace externo", () => {
  test("arma la URL de IMDb con /es/title/{id}/", () => {
    expect(buildTitleUrl("https://www.imdb.com/", "tt123")).toBe(
      "https://www.imdb.com/es/title/tt123/"
    );
  });
  test("cambia el dominio a playimdb manteniendo el formato", () => {
    expect(buildTitleUrl("https://playimdb.online/", "tt123")).toBe(
      "https://playimdb.online/es/title/tt123/"
    );
  });
  test("tolera dominio sin barra final", () => {
    expect(buildTitleUrl("https://playimdb.online", "tt9")).toBe(
      "https://playimdb.online/es/title/tt9/"
    );
  });
  test("sin id devuelve vacío", () => {
    expect(buildTitleUrl("https://www.imdb.com/", "")).toBe("");
  });
});

describe("Clasificación adulta (censura)", () => {
  test("R y NC-17 son adultos (cine)", () => {
    expect(isAdultRating("R", "movie")).toBe(true);
    expect(isAdultRating("NC-17", "movie")).toBe(true);
  });
  test("PG-13 no es adulto", () => {
    expect(isAdultRating("PG-13", "movie")).toBe(false);
  });
  test("TV-MA es adulto (series), TV-14 no", () => {
    expect(isAdultRating("TV-MA", "tv")).toBe(true);
    expect(isAdultRating("TV-14", "tv")).toBe(false);
  });
});

describe("Utilidades", () => {
  test("formatRuntime formatea horas y minutos", () => {
    expect(formatRuntime(127)).toBe("2h 7min");
    expect(formatRuntime(45)).toBe("45min");
    expect(formatRuntime(0)).toBe(null);
  });
  test("titleOf usa title o name", () => {
    expect(titleOf({ title: "A" })).toBe("A");
    expect(titleOf({ name: "B" })).toBe("B");
  });
  test("yearOf saca el año de la fecha", () => {
    expect(yearOf({ release_date: "2024-05-01" })).toBe("2024");
    expect(yearOf({ first_air_date: "2019-01-01" })).toBe("2019");
    expect(yearOf({})).toBe(null);
  });
});

describe("Idioma (i18n)", () => {
  test("traduce según el idioma activo", () => {
    setUiLang("es");
    expect(t("movies")).toBe("Películas");
    setUiLang("en");
    expect(t("movies")).toBe("Movies");
    setUiLang("es");
  });
  test("una clave desconocida devuelve la misma clave", () => {
    expect(t("__no_existe__")).toBe("__no_existe__");
  });
});

describe("normalize (acentos)", () => {
  test("quita acentos y pasa a minúsculas", () => {
    expect(normalize("Tiburón")).toBe("tiburon");
    expect(normalize("  Acción  ")).toBe("accion");
  });
});

describe("getCertification", () => {
  test("película: toma la clasificación de US", () => {
    const data = {
      release_dates: {
        results: [
          { iso_3166_1: "US", release_dates: [{ certification: "PG-13" }] },
        ],
      },
    };
    expect(getCertification(data, "movie")).toBe("PG-13");
  });
  test("serie: toma content_ratings de US", () => {
    const data = {
      content_ratings: { results: [{ iso_3166_1: "US", rating: "TV-MA" }] },
    };
    expect(getCertification(data, "tv")).toBe("TV-MA");
  });
  test("sin datos devuelve vacío", () => {
    expect(getCertification({}, "movie")).toBe("");
  });
});

describe("filterSharks con series", () => {
  test("bloquea por el campo name (serie)", () => {
    expect(isSharkRelated({ name: "Sharknado: The Series" })).toBe(true);
  });
});
