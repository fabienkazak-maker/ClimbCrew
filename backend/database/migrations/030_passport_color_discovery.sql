-- 030_passport_color_discovery.sql
-- Sépare la couleur du passeport de l'option Découverte.

alter table participants
  add column if not exists passport_decouverte boolean not null default false;

update participants
set passport_decouverte = true
where lower(trim(passport)) in ('decouverte', 'decouvertes', 'découverte', 'découvertes')
   or lower(trim(passport)) ~ '_d;

update participants
set passport = case
  when lower(trim(passport)) in ('', 'sans', 'decouverte', 'decouvertes', 'découverte', 'découvertes')
    then 'gris'
  when lower(trim(passport)) like '%\_d' escape '\\'
    then regexp_replace(lower(trim(passport)), '_d$', '')
  else lower(trim(passport))
end;

alter table participants
  alter column passport set default 'gris';
;

update participants
set passport = case
  when lower(trim(passport)) in ('', 'sans', 'decouverte', 'decouvertes', 'découverte', 'découvertes')
    then 'gris'
  when lower(trim(passport)) ~ '_d
    then regexp_replace(lower(trim(passport)), '_d$', '')
  else lower(trim(passport))
end;

alter table participants
  alter column passport set default 'gris';

    then regexp_replace(lower(trim(passport)), '_d$', '')
  else lower(trim(passport))
end;

alter table participants
  alter column passport set default 'gris';
