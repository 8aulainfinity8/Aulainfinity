# REGLAS DE PRODUCCIÓN — AULAINFINITY

1. NO ejecutar firebase deploy automáticamente.
2. NO ejecutar firebase functions:delete.
3. NO modificar Cloud Functions de producción sin autorización explícita.
4. NO cambiar la generación (1st Gen / 2nd Gen) de una función existente.
5. NO modificar Firestore database configuration.
6. NO modificar IAM, Eventarc o Service Accounts.
7. Antes de cualquier cambio:
   - ejecutar git status
   - revisar git diff
   - explicar el cambio
   - esperar autorización.
8. syncUserRole es una función 2nd Gen.
9. syncUserRole utiliza Firestore Enterprise:
   ai-studio-aulainfinity-6be7791f-ef3e-4fc4-b45b-98918b1b57ca
10. Los cambios administrativos de roles deben pasar por adminSetUserClaims.
11. Nunca usar git add . sin revisar previamente los archivos.
12. Nunca borrar backups sin autorización.
