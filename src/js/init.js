/* eslint-disable no-new */
import addInputMaskPhone from './handlers/form-elements/phone-mask'
import CustomSelect from './handlers/form-elements/custom-select'
import MultipleCustomSelect from './handlers/form-elements/multiple-custom-select'

import formSender from './handlers/form-sender'
import { modalHandler, modalGallery } from './handlers/modals'

function initApp() {
  window.$body = $('.js-body')
  
  /**
   *  Добавление масок к номерам телефонов
   */
  addInputMaskPhone()

  /**
   * Обработчик поведение списков выбора
   */
  $('.js-custom-select').each(function () {
    new CustomSelect($(this))
  })

  /**
   * Обработчик поведение множественных списков выбора
   */
  $('.js-custom-multiple-select').each(function () {
    new MultipleCustomSelect($(this))
  })

  /**
   * Обработчик отправки форм
   */
  formSender.init()

  /**
   * Инициализация модальных окон
   */
  modalHandler.init()

  /**
   * Инициализация модальных окон для просмотра фото
   */
  modalGallery.init()
}

export { initApp }
