# Frontend — Angular

Aplicación Angular 20 del CRUD de productos. La documentación general del proyecto está en el [README principal](../README.md).

```bash
npm install
npm start          # http://localhost:4200 (requiere el backend corriendo en el puerto 3000)
npm run build      # build de producción en dist/frontend
npm test           # tests con Karma + Jasmine
```

En desarrollo, las peticiones a `/api` se redirigen al backend mediante `proxy.conf.json`.
