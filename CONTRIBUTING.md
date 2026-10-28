# Cómo contribuir

Gracias por querer aportar a ToolsBuild. `master` está protegida: **ningún cambio entra sin pull request, CI en verde y revisión del mantenedor**.

## Flujo paso a paso

1. **Haz fork** del repositorio (botón *Fork* arriba a la derecha).
2. **Clona tu fork** y crea una rama descriptiva desde `master`:

   ```bash
   git clone https://github.com/<tu-usuario>/ToolsBuild.git
   cd ToolsBuild
   git checkout -b feat/mi-mejora   # o fix/mi-bug
   ```

3. **Instala dependencias** (Node >= 22.12):

   ```bash
   npm ci
   ```

4. **Desarrolla** con el servidor local:

   ```bash
   npm run dev
   ```

5. **Verifica antes de subir** — el CI ejecuta exactamente esto y no se puede mergear si falla:

   ```bash
   npm run check
   npm run build
   ```

6. **Haz commit** siguiendo el estilo del repo (`feat:`, `fix:`, `docs:`, `refactor:`):

   ```bash
   git add .
   git commit -m "feat: describe el cambio"
   git push origin feat/mi-mejora
   ```

7. **Abre el Pull Request** contra `master` y rellena la plantilla. Enlaza la issue con `Closes #123`.

## Qué pasa después de abrir el PR

- GitHub pedirá a un mantenedor que **apruebe la ejecución del CI** (medida de seguridad para PRs de forks). Hasta entonces el check queda en espera.
- El job `ci` debe pasar: `npm ci` + `npm run check` + `npm run build`.
- Si `master` avanzó, actualiza tu rama (merge o rebase) para que el PR quede al día.
- Se requiere **1 aprobación** y resolver todos los comentarios.
- El mantenedor mergea con **squash**; tu PR se convierte en un único commit lineal en `master`.

## Reglas importantes

- **No subas secretos** ni archivos `.env`. El repo es público y tiene push protection activa.
- No modifiques archivos de la lista de `.gitignore` (panel admin, `dist/`, `node_modules/`).
- Un PR = un cambio coherente. Evita mezclar refactors grandes con features.
- Los cambios de seguridad repórtalos en privado (ver *Security advisories*), no en un issue público.

## Entorno local

Copia `.env.example` a `.env` y rellena las claves que necesites. Sin claves el sitio funciona, pero las búsquedas con IA quedan deshabilitadas.
