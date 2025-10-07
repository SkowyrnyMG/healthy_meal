# Dokument wymagań produktu (PRD) - HealthyMeal

## 1. Przegląd produktu

HealthyMeal to aplikacja webowa wykorzystująca sztuczną inteligencję do modyfikacji przepisów kulinarnych zgodnie z indywidualnymi potrzebami żywieniowymi użytkowników. Aplikacja pozwala użytkownikom zapisywać, modyfikować i przeglądać przepisy dostosowane do ich diet i preferencji, co ułatwia im realizację celów zdrowotnych.

### 1.1 Cel produktu

Stworzenie intuicyjnego narzędzia, które rozwiązuje problem dostosowywania przepisów kulinarnych do indywidualnych potrzeb żywieniowych poprzez wykorzystanie sztucznej inteligencji.

### 1.2 Grupa docelowa

- Osoby chcące schudnąć
- Osoby ćwiczące chcące rozbudować sylwetkę
- Osoby z małą ilością czasu na gotowanie

### 1.3 Specyfikacja techniczna

- Stack: Astro + Supabase + Tailwind
- Integracja AI: OpenRouter.ai poprzez OpenAI SDK
- Platforma: Aplikacja webowa (responsive, z priorytetem dla urządzeń mobilnych)
- Język interfejsu: Polski

## 2. Problem użytkownika

Dostosowywanie dostępnych w sieci przepisów kulinarnych do osobistych potrzeb i wymagań żywieniowych jest problematyczne z wielu powodów:

- Standardowe przepisy nie uwzględniają specyficznych diet (wysokobiałkowa, keto, wegetariańska)
- Ręczne przeliczanie wartości odżywczych przy modyfikacjach jest czasochłonne i podatne na błędy
- Zmiana składników na zdrowsze alternatywy wymaga specjalistycznej wiedzy
- Dopasowanie przepisów pod kątem celów (redukcja lub zwiększenie wagi) jest trudne
- Osoby z ograniczonym czasem nie mają możliwości analizowania i modyfikowania przepisów

HealthyMeal rozwiązuje te problemy, automatyzując proces modyfikacji przepisów za pomocą AI z uwzględnieniem preferencji i celów użytkownika.

## 3. Wymagania funkcjonalne

### 3.1 System kont użytkowników

- Rejestracja i logowanie przez email/hasło (Supabase Auth)
- Profil użytkownika zawierający dane podstawowe: waga, wiek, płeć, poziom aktywności
- Preferencje żywieniowe: wybór diety, alergeny, nielubiane składniki, cele dietetyczne

### 3.2 Zarządzanie przepisami

- Dodawanie własnych przepisów z wykorzystaniem formularza wieloetapowego
- Przeglądanie, edycja i usuwanie przepisów
- Informacje o przepisie: tytuł, składniki, kroki przygotowania, czas przygotowania, wartości odżywcze (kalorie, białko, tłuszcz, węglowodany, błonnik, sól)
- System hasztagów: predefiniowana lista 15-20 głównych kategorii z automatycznym przypisywaniem
- Wyszukiwanie i filtrowanie przepisów: po tytule, hasztagach, kaloryczności, czasie przygotowania
- Zapisywanie przepisów do ulubionych i organizowanie w kolekcje

### 3.3 Modyfikacja przepisów przez AI

- Dostosowywanie kaloryczności (obniżanie/podwyższanie)
- Zwiększanie zawartości białka i błonnika
- Zmiana wielkości porcji z automatycznym przeliczaniem składników i wartości odżywczych
- Wyszukiwanie zdrowszych zamienników dla składników z porównaniem wartości odżywczych
- Interfejs modyfikacji: suwaki/przyciski do określania parametrów, podgląd zmian przed/po

### 3.4 Wizualizacja danych

- Wykresy kołowe dla makroskładników w przepisach
- Paski postępu pokazujące realizację dziennego zapotrzebowania
- System oceny przepisów: gwiazdki (1-5) z pytaniem "Czy ugotowałeś/aś ten przepis?" (tak/nie)

### 3.5 Planowanie posiłków

- Prosty kalendarz tygodniowy do przypisywania przepisów do dni
- Możliwość przeglądania i usuwania zaplanowanych posiłków

### 3.6 Panel administratora

- Statystyki użytkowników: liczba, procent z wypełnionymi preferencjami, retention rate
- Statystyki przepisów: liczba wygenerowanych, oceny, najczęstsze modyfikacje

## 4. Granice produktu

### 4.1 Co NIE wchodzi w zakres MVP

- Import przepisów z adresu URL
- Obsługa multimediów (np. zdjęcia przepisów)
- Udostępnianie przepisów dla innych użytkowników
- Funkcje społecznościowe (komentarze, udostępnianie)
- Funkcje offline
- Obsługa wielu języków
- System płatności i monetyzacji

### 4.2 Plany rozwojowe po MVP

- Import przepisów z URL
- Natywne aplikacje mobilne dla iOS i Android
- Rozszerzenie funkcji społecznościowych

### 4.3 Harmonogram rozwoju

Rozwój aplikacji podzielony na 6 faz, każda trwająca maksymalnie 1,5 tygodnia:

1. System użytkowników i preferencje
2. Podstawowy CRUD przepisów
3. Praca nad UI użytkownika
4. Integracja AI
5. Testy i optymalizacja
6. Dashboard admina i landing page

## 5. Historyjki użytkowników

### Konta i Uwierzytelnianie

#### US-001: Rejestracja nowego użytkownika

Jako nowy użytkownik, chcę zarejestrować się w aplikacji, aby móc korzystać z jej funkcji.

Kryteria akceptacji:

1. Użytkownik może utworzyć konto podając email i hasło
2. System weryfikuje unikalność adresu email
3. System wymaga hasła o minimalnej długości 8 znaków
4. Po rejestracji użytkownik jest automatycznie zalogowany
5. Użytkownik otrzymuje potwierdzenie utworzenia konta

#### US-002: Logowanie istniejącego użytkownika

Jako zarejestrowany użytkownik, chcę zalogować się do aplikacji, aby uzyskać dostęp do moich przepisów i preferencji.

Kryteria akceptacji:

1. Użytkownik może zalogować się podając email i hasło
2. System weryfikuje poprawność danych logowania
3. Po zalogowaniu użytkownik jest przekierowany na stronę główną
4. System wyświetla komunikat o błędzie przy niepoprawnych danych

#### US-003: Odzyskiwanie hasła

Jako użytkownik, który zapomniał hasła, chcę zresetować swoje hasło, aby odzyskać dostęp do konta.

Kryteria akceptacji:

1. Użytkownik może zainicjować proces resetowania hasła podając adres email
2. System wysyła link do resetowania hasła na podany adres email
3. Użytkownik może ustawić nowe hasło po kliknięciu w link
4. System potwierdza zmianę hasła

#### US-004: Wylogowanie

Jako zalogowany użytkownik, chcę wylogować się z aplikacji, aby zabezpieczyć moje dane.

Kryteria akceptacji:

1. Użytkownik może wylogować się z aplikacji jednym kliknięciem
2. Po wylogowaniu użytkownik jest przekierowany na stronę logowania
3. Po wylogowaniu dostęp do zabezpieczonych zasobów jest niemożliwy

### Profil Użytkownika

#### US-005: Uzupełnianie profilu o dane podstawowe

Jako nowy użytkownik, chcę uzupełnić mój profil o podstawowe dane, aby aplikacja mogła lepiej dopasować przepisy do moich potrzeb.

Kryteria akceptacji:

1. Użytkownik może wprowadzić podstawowe dane: waga, wiek, płeć, poziom aktywności
2. System zapisuje wprowadzone dane
3. System wyświetla komunikat potwierdzający zapisanie danych

#### US-006: Ustawianie preferencji żywieniowych

Jako użytkownik, chcę określić moje preferencje żywieniowe, aby otrzymywać dostosowane przepisy.

Kryteria akceptacji:

1. Użytkownik może wybrać preferowaną dietę (wysokobiałkowa, Keto, wegetariańska, na przybieranie wagi, na redukcję wagi)
2. Użytkownik może określić alergeny i nielubiane składniki
3. Użytkownik może określić preferowane proporcje makroskładników
4. System zapisuje preferencje i uwzględnia je przy generowaniu przepisów

#### US-007: Edycja danych profilu

Jako użytkownik, chcę edytować moje dane profilowe, aby aktualizować informacje o sobie.

Kryteria akceptacji:

1. Użytkownik może edytować wszystkie wprowadzone wcześniej dane
2. System zapisuje zaktualizowane dane
3. System wyświetla komunikat potwierdzający aktualizację danych

#### US-008: Określanie celów dietetycznych

Jako użytkownik, chcę określić moje cele dietetyczne, aby otrzymywać przepisy pomagające w ich osiągnięciu.

Kryteria akceptacji:

1. Użytkownik może wybrać cel (schudnąć, przytyć, utrzymać wagę)
2. Użytkownik może określić docelową wartość (np. schudnąć 5kg)
3. System zapisuje cele i uwzględnia je przy generowaniu przepisów

### Zarządzanie Przepisami

#### US-009: Dodawanie nowego przepisu

Jako użytkownik, chcę dodać nowy przepis, aby zapisać go w mojej kolekcji.

Kryteria akceptacji:

1. Użytkownik może wprowadzić tytuł, składniki, kroki przygotowania, czas przygotowania
2. System umożliwia wprowadzenie wartości odżywczych (kalorie, białko, tłuszcz, węglowodany, błonnik, sól)
3. System umożliwia przypisanie hasztagów
4. System zapisuje przepis i przypisuje go do konta użytkownika

#### US-010: Przeglądanie istniejących przepisów

Jako użytkownik, chcę przeglądać moje przepisy, aby znaleźć interesujące mnie pozycje.

Kryteria akceptacji:

1. System wyświetla listę przepisów użytkownika
2. Lista zawiera podstawowe informacje o przepisach (tytuł, krótki opis, wartości odżywcze)
3. Użytkownik może wybrać przepis, aby zobaczyć jego szczegóły

#### US-011: Edycja przepisu

Jako użytkownik, chcę edytować moje przepisy, aby aktualizować lub poprawiać ich zawartość.

Kryteria akceptacji:

1. Użytkownik może edytować wszystkie elementy przepisu
2. System zapisuje zaktualizowane dane
3. System wyświetla komunikat potwierdzający aktualizację przepisu

#### US-012: Usuwanie przepisu

Jako użytkownik, chcę usuwać niepotrzebne przepisy, aby utrzymać porządek w mojej kolekcji.

Kryteria akceptacji:

1. Użytkownik może usunąć wybrany przepis
2. System prosi o potwierdzenie przed usunięciem
3. Po usunięciu przepis nie jest już widoczny w kolekcji użytkownika

#### US-013: Wyszukiwanie i filtrowanie przepisów

Jako użytkownik, chcę wyszukiwać i filtrować przepisy, aby szybko znajdować interesujące mnie pozycje.

Kryteria akceptacji:

1. Użytkownik może wyszukiwać przepisy po tytule
2. Użytkownik może filtrować przepisy według hasztagów
3. Użytkownik może filtrować przepisy według kaloryczności (poniżej/powyżej X kcal)
4. Użytkownik może filtrować przepisy według czasu przygotowania (do X minut)
5. System wyświetla wyniki pasujące do kryteriów wyszukiwania/filtrowania

#### US-014: Zapisywanie przepisów do ulubionych

Jako użytkownik, chcę zapisywać przepisy jako ulubione, aby łatwo do nich wracać.

Kryteria akceptacji:

1. Użytkownik może oznaczyć przepis jako ulubiony
2. Użytkownik może usunąć przepis z ulubionych
3. System wyświetla oddzielną listę ulubionych przepisów

#### US-015: Organizowanie przepisów w kolekcje

Jako użytkownik, chcę organizować przepisy w kolekcje, aby lepiej je kategoryzować.

Kryteria akceptacji:

1. Użytkownik może tworzyć kolekcje z nazwą
2. Użytkownik może dodawać przepisy do kolekcji
3. Użytkownik może usuwać przepisy z kolekcji
4. Użytkownik może przeglądać kolekcje i zawarte w nich przepisy

### Modyfikacja Przepisów przez AI

#### US-016: Dostosowanie kaloryczności przepisu

Jako użytkownik, chcę modyfikować kaloryczność przepisu, aby dostosować go do moich potrzeb dietetycznych.

Kryteria akceptacji:

1. Użytkownik może wybrać opcję zmniejszenia lub zwiększenia kaloryczności
2. System wykorzystuje AI do zmodyfikowania przepisu
3. System pokazuje podgląd zmian przed/po modyfikacji
4. Użytkownik może zatwierdzić lub odrzucić zmodyfikowany przepis

#### US-017: Zwiększenie zawartości białka

Jako użytkownik, chcę zwiększyć zawartość białka w przepisie, aby lepiej wspierać moje cele treningowe.

Kryteria akceptacji:

1. Użytkownik może wybrać opcję zwiększenia zawartości białka
2. System wykorzystuje AI do zmodyfikowania przepisu
3. System pokazuje podgląd zmian przed/po modyfikacji
4. Użytkownik może zatwierdzić lub odrzucić zmodyfikowany przepis

#### US-018: Zmiana wielkości porcji

Jako użytkownik, chcę zmieniać wielkość porcji, aby przygotować odpowiednią ilość jedzenia.

Kryteria akceptacji:

1. Użytkownik może zwiększyć lub zmniejszyć liczbę porcji za pomocą suwaka/przycisków +/-
2. System automatycznie przelicza ilość składników
3. System przelicza wartości odżywcze na porcję

#### US-019: Wyszukiwanie zdrowszych zamienników składników

Jako użytkownik, chcę znajdować zdrowsze zamienniki składników, aby poprawić wartość odżywczą przepisu.

Kryteria akceptacji:

1. Użytkownik może zaznaczyć składnik do zamiany
2. System proponuje 2-3 zdrowsze alternatywy
3. System pokazuje porównanie wartości odżywczych oryginalnego składnika i zamienników
4. Użytkownik może wybrać zamiennik lub pozostać przy oryginalnym składniku
5. Jeśli zamiennik nie istnieje w bazie, system wykorzystuje AI do zaproponowania alternatywy
6. Użytkownik ma możliwość cofnięcia zmiany

#### US-020: Ocena zmodyfikowanego przepisu

Jako użytkownik, chcę ocenić zmodyfikowany przepis, aby podzielić się opinią o jakości modyfikacji.

Kryteria akceptacji:

1. Użytkownik może ocenić przepis w skali 1-5 gwiazdek
2. Użytkownik może odpowiedzieć na pytanie "Czy ugotowałeś/aś ten przepis?" (tak/nie)
3. System zapisuje ocenę i uwzględnia ją w statystykach

### Planowanie Posiłków

#### US-021: Przypisywanie przepisów do dni w kalendarzu

Jako użytkownik, chcę przypisywać przepisy do konkretnych dni, aby planować moje posiłki.

Kryteria akceptacji:

1. Użytkownik może wybrać dzień z kalendarza
2. Użytkownik może przypisać przepis do wybranego dnia
3. System zapisuje przypisanie i wyświetla przepis w kalendarzu

#### US-022: Przeglądanie zaplanowanych posiłków

Jako użytkownik, chcę przeglądać zaplanowane posiłki, aby wiedzieć, co będę gotować.

Kryteria akceptacji:

1. System wyświetla przepisy przypisane do poszczególnych dni
2. Użytkownik może zobaczyć szczegóły zaplanowanych przepisów

#### US-023: Usuwanie zaplanowanych posiłków

Jako użytkownik, chcę usuwać zaplanowane posiłki, aby modyfikować mój plan.

Kryteria akceptacji:

1. Użytkownik może usunąć przepis z kalendarza
2. System usuwa przypisanie przepisu do danego dnia

### Panel Administratora

#### US-024: Przeglądanie statystyk użytkowników

Jako administrator, chcę przeglądać statystyki użytkowników, aby monitorować aktywność w aplikacji.

Kryteria akceptacji:

1. System wyświetla liczbę zarejestrowanych użytkowników
2. System wyświetla procent użytkowników z wypełnionymi preferencjami
3. System wyświetla dane o retention rate

#### US-025: Przeglądanie statystyk generowania przepisów

Jako administrator, chcę przeglądać statystyki generowania przepisów, aby monitorować wykorzystanie funkcji AI.

Kryteria akceptacji:

1. System wyświetla liczbę wygenerowanych przepisów
2. System wyświetla średnią liczbę wygenerowanych przepisów na użytkownika
3. System wyświetla najpopularniejsze typy modyfikacji

#### US-026: Przeglądanie statystyk ocen przepisów

Jako administrator, chcę przeglądać statystyki ocen przepisów, aby monitorować jakość modyfikacji AI.

Kryteria akceptacji:

1. System wyświetla średnie oceny zmodyfikowanych przepisów
2. System wyświetla procent przepisów, które zostały faktycznie ugotowane
3. System wyświetla trendy w ocenach w czasie

## 6. Metryki sukcesu

### 6.1 Metryki użytkownika

- 90% użytkowników posiada wypełnioną sekcję preferencji żywieniowych w swoim profilu
- 75% użytkowników generuje jeden lub więcej przepisów tygodniowo
- Czas spędzony w aplikacji: średnio 10 minut na sesję
- Wskaźnik powrotu do aplikacji (retention rate): 40% użytkowników wraca w ciągu tygodnia

### 6.2 Metryki jakości AI

- Jakość modyfikacji AI oceniana według zdefiniowanych kryteriów:
  - Spójność kulinarna: czy przepis ma sens z kulinarnego punktu widzenia
  - Zgodność z celem modyfikacji: czy faktycznie zmniejsza kalorie/zwiększa białko
  - Zachowanie smaku i wykonalność
  - Poprawność obliczeń wartości odżywczych
- Średnia ocena zmodyfikowanych przepisów: minimum 3.5/5 gwiazdek
- Procent przepisów wymagających ręcznej korekty po modyfikacji AI: poniżej 30%

### 6.3 Metryki techniczne

- Czas ładowania strony: poniżej 2 sekundy
- Czas generowania modyfikacji przepisu: poniżej 5 sekund
- Poprawność obliczania wartości odżywczych: 95% dokładności

### 6.4 Monitorowanie

- Regularne przeglądy statystyk z dashboardu administratora
- Okresowa analiza ocen i komentarzy użytkowników
- Automatyczne alerty przy spadku kluczowych metryk poniżej określonych progów
