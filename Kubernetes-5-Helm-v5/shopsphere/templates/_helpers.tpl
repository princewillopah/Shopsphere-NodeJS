{{/*
Expand the name of the chart.
*/}}
{{- define "shopsphere.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/*
Create a default fully qualified app name.
*/}}
{{- define "shopsphere.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}


{{/*
Chart label.
*/}}
{{- define "shopsphere.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/*
Common labels.
*/}}
{{- define "shopsphere.labels" -}}
helm.sh/chart: {{ include "shopsphere.chart" . }}
{{ include "shopsphere.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}


{{/*
Selector labels.
*/}}
{{- define "shopsphere.selectorLabels" -}}
app.kubernetes.io/name: {{ include "shopsphere.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}


{{/*
Backend name.
*/}}
{{- define "shopsphere.backend.fullname" -}}
{{- printf "%s-backend" (include "shopsphere.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/*
Frontend name.
*/}}
{{- define "shopsphere.frontend.fullname" -}}
{{- printf "%s-frontend" (include "shopsphere.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/*
MySQL name.
*/}}
{{- define "shopsphere.mysql.fullname" -}}
{{- printf "%s-mysql" (include "shopsphere.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/*
Backend selector labels.
*/}}
{{- define "shopsphere.backend.selectorLabels" -}}
{{ include "shopsphere.selectorLabels" . }}
app.kubernetes.io/component: backend
{{- end }}


{{/*
Frontend selector labels.
*/}}
{{- define "shopsphere.frontend.selectorLabels" -}}
{{ include "shopsphere.selectorLabels" . }}
app.kubernetes.io/component: frontend
{{- end }}


{{/*
MySQL selector labels.
*/}}
{{- define "shopsphere.mysql.selectorLabels" -}}
{{ include "shopsphere.selectorLabels" . }}
app.kubernetes.io/component: mysql
{{- end }}


{{/*
Backend labels.
*/}}
{{- define "shopsphere.backend.labels" -}}
{{ include "shopsphere.labels" . }}
app.kubernetes.io/component: backend
{{- end }}


{{/*
Frontend labels.
*/}}
{{- define "shopsphere.frontend.labels" -}}
{{ include "shopsphere.labels" . }}
app.kubernetes.io/component: frontend
{{- end }}


{{/*
MySQL labels.
*/}}
{{- define "shopsphere.mysql.labels" -}}
{{ include "shopsphere.labels" . }}
app.kubernetes.io/component: mysql
{{- end }}

{{/*
Service account name.
*/}}
{{- define "shopsphere.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "shopsphere.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}